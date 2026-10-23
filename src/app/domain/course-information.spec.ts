import { describe, expect, it } from 'vitest';
import { courseInformationSections } from './course-information';

describe('course information presentation', () => {
  it('groups existing headings and preserves every paragraph without interpreting content', () => {
    const source =
      'MOJ PROJEKT: AutoDnevnik\nOpis projekta.\n\nDodatni opis.\n\nBODOVANJE\nMinimum: \n• Nepoznato nije nula.';
    const sections = courseInformationSections(source);
    expect(sections.map((s) => s.title)).toEqual(['MOJ PROJEKT: AutoDnevnik', 'BODOVANJE']);
    expect(sections[0].paragraphs).toEqual(['Opis projekta.', 'Dodatni opis.']);
    expect(sections[1].paragraphs[0]).toBe('Minimum: \n• Nepoznato nije nula.');
  });
  it('retains plain notes, markup-looking text and CRLF without requiring headings', () => {
    expect(
      courseInformationSections('Bilješka <script> nije HTML.\r\nDrugi redak.')[0].paragraphs,
    ).toEqual(['Bilješka <script> nije HTML.\r\nDrugi redak.']);
    expect(courseInformationSections('')).toEqual([]);
  });
});
