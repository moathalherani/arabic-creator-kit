import unittest

import arabic_autocaptions as ac

W = ac.Word
SAMPLE = [
    W("مرحبا", 0.0, 0.4), W("يعني", 0.4, 0.6), W("جربت", 0.7, 1.0), W("iPhone", 1.0, 1.4), W("17", 1.4, 1.6),
    W("لمدة", 1.7, 2.0), W("٣٠", 2.0, 2.3), W("يوم…", 2.3, 2.6), W("والنتيجة", 3.0, 3.6), W("صدمتني.", 3.6, 4.4),
]


class Chunking(unittest.TestCase):
    def test_short_chunks_without_fillers(self):
        chunks = ac.make_chunks(SAMPLE)
        self.assertTrue(all(len(c.words) <= 4 for c in chunks))
        self.assertNotIn("يعني", " ".join(c.text for c in chunks))
        self.assertEqual(chunks[-1].words, ["والنتيجة", "صدمتني"])

    def test_latin_digits_and_clean_punctuation(self):
        text = " ".join(c.text for c in ac.make_chunks(SAMPLE))
        self.assertIn("30", text)
        self.assertNotIn("٣٠", text)
        self.assertNotIn("…", text)

    def test_keeps_arabic_digits_when_asked(self):
        text = " ".join(c.text for c in ac.make_chunks(SAMPLE, latin_digits=False))
        self.assertIn("٣٠", text)

    def test_pause_starts_a_new_chunk(self):
        chunks = ac.make_chunks([W("أول", 0, 0.3), W("جملة", 2.0, 2.3)])
        self.assertEqual(len(chunks), 2)

    def test_chunks_never_overlap(self):
        chunks = ac.make_chunks(SAMPLE, max_words=2)
        for a, b in zip(chunks, chunks[1:]):
            self.assertLessEqual(a.end, b.start)

    def test_max_words_validation(self):
        with self.assertRaises(ValueError):
            ac.make_chunks(SAMPLE, max_words=0)


class Keywords(unittest.TestCase):
    def test_numbers_beat_english_beat_long_words(self):
        self.assertEqual(ac.pick_keyword(["جربت", "iPhone", "17"]), 2)
        self.assertEqual(ac.pick_keyword(["جربت", "iPhone"]), 1)
        self.assertEqual(ac.pick_keyword(["في", "والنتيجة"]), 1)
        self.assertEqual(ac.pick_keyword(["في", "من"]), -1)


class Output(unittest.TestCase):
    def test_bidi_isolates(self):
        self.assertEqual(ac.isolate_latin("جربت BYD Seal 30 يوم"), "جربت \u2066BYD Seal 30\u2069 يوم")
        self.assertEqual(ac.isolate_latin("only English"), "only English")

    def test_times(self):
        self.assertEqual(ac.srt_time(3661.5), "01:01:01,500")
        self.assertEqual(ac.ass_time(61.257), "0:01:01.26")

    def test_ass(self):
        ass = ac.to_ass(ac.make_chunks(SAMPLE), 1080, 1920, highlight="#7FB069")
        self.assertIn("PlayResY: 1920", ass)
        self.assertRegex(ass, r"(?m)^Style: Default,Changa,84,.*,-1$")
        self.assertIn("{\\c&H0069B07F&}", ass)
        self.assertNotRegex(ass, "\u2066[^\u2069]*\\{", "isolates never wrap override tags")

    def test_landscape_defaults(self):
        ass = ac.to_ass(ac.make_chunks(SAMPLE), 1920, 1080)
        self.assertRegex(ass, r"Style: Default,Changa,67,")

    def test_srt(self):
        srt = ac.to_srt(ac.make_chunks(SAMPLE))
        self.assertTrue(srt.startswith("1\n00:00:00,000 --> "))

    def test_color_validation(self):
        with self.assertRaises(ValueError):
            ac.hex_to_ass("green")


if __name__ == "__main__":
    unittest.main()
