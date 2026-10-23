export interface CourseInformationSection {
  title: string;
  paragraphs: string[];
}

// Keep the stored plain text intact; only derive headings for presentation.
export function courseInformationSections(text: string): CourseInformationSection[] {
  const sections: CourseInformationSection[] = [];
  for (const paragraph of text.split(/\r?\n\s*\r?\n/).filter((p) => p.trim())) {
    const lines = paragraph.split(/\r?\n/);
    const title = lines[0].trim();
    const prefix = title.split(/[:—–]/)[0].trim();
    const heading =
      lines.length > 1 &&
      title.length <= 130 &&
      /[A-ZČĆŽŠĐ]{3}/.test(prefix) &&
      prefix === prefix.toLocaleUpperCase('hr');
    if (heading) sections.push({ title, paragraphs: [lines.slice(1).join('\n')] });
    else {
      if (!sections.length) sections.push({ title: 'Informacije o kolegiju', paragraphs: [] });
      sections[sections.length - 1].paragraphs.push(paragraph);
    }
  }
  return sections;
}
