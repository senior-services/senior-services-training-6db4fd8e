-- Insert 6 example HR and company policy training videos
INSERT INTO public.videos (title, description, type, has_quiz, assigned_to, completion_rate) VALUES 
(
  'Workplace Safety and Emergency Procedures',
  'Comprehensive training on workplace safety protocols, emergency evacuation procedures, and incident reporting. Covers fire safety, first aid basics, and how to respond to various emergency situations in the office environment.',
  'Required',
  true,
  15,
  73
),
(
  'Anti-Harassment and Discrimination Policy',
  'Essential training on recognizing, preventing, and reporting workplace harassment and discrimination. Includes examples of inappropriate behavior, proper reporting channels, and creating an inclusive work environment for all employees.',
  'Required',
  true,
  15,
  87
),
(
  'Data Privacy and Information Security',
  'Critical training on protecting sensitive company and client information. Covers password security, email safety, handling confidential documents, and compliance with data protection regulations like HIPAA and GDPR.',
  'Required',
  true,
  15,
  45
),
(
  'Employee Code of Conduct and Ethics',
  'Overview of company values, ethical standards, and expected professional behavior. Includes conflict of interest policies, social media guidelines, and maintaining professional relationships with clients and colleagues.',
  'Required',
  false,
  15,
  92
),
(
  'Time Management and Productivity Best Practices',
  'Practical strategies for effective time management, prioritizing tasks, and maintaining work-life balance. Optional training designed to help employees maximize productivity while reducing stress and burnout.',
  'Optional',
  false,
  8,
  34
),
(
  'Performance Review Process and Career Development',
  'Guide to understanding the annual performance review process, setting professional goals, and accessing career development resources. Includes tips for self-evaluation and preparing for advancement opportunities.',
  'Optional',
  false,
  12,
  28
);