-- Secteurs desservis à Ottawa–Gatineau (mêmes valeurs que src/data/config.ts)
insert into public.service_sectors (id, name, province, center) values
  ('byward',     'Centre-ville / Marché By', 'ON', 'SRID=4326;POINT(-75.693 45.426)'),
  ('glebe',      'Glebe / Vieil Ottawa-Sud', 'ON', 'SRID=4326;POINT(-75.687 45.400)'),
  ('vanier',     'Vanier / Overbrook',       'ON', 'SRID=4326;POINT(-75.663 45.437)'),
  ('westboro',   'Westboro / Hintonburg',    'ON', 'SRID=4326;POINT(-75.755 45.391)'),
  ('nepean',     'Nepean',                   'ON', 'SRID=4326;POINT(-75.724 45.334)'),
  ('barrhaven',  'Barrhaven',                'ON', 'SRID=4326;POINT(-75.740 45.275)'),
  ('kanata',     'Kanata',                   'ON', 'SRID=4326;POINT(-75.913 45.309)'),
  ('orleans',    'Orléans',                  'ON', 'SRID=4326;POINT(-75.517 45.469)'),
  ('gloucester', 'Gloucester / South Keys',  'ON', 'SRID=4326;POINT(-75.650 45.360)'),
  ('hull',       'Hull (centre-ville)',      'QC', 'SRID=4326;POINT(-75.713 45.428)'),
  ('plateau',    'Plateau / Mont-Bleu',      'QC', 'SRID=4326;POINT(-75.765 45.447)'),
  ('aylmer',     'Aylmer',                   'QC', 'SRID=4326;POINT(-75.840 45.395)'),
  ('gatineau',   'Gatineau (secteur)',       'QC', 'SRID=4326;POINT(-75.650 45.486)'),
  ('masson',     'Masson-Angers',            'QC', 'SRID=4326;POINT(-75.420 45.540)'),
  ('buckingham', 'Buckingham',               'QC', 'SRID=4326;POINT(-75.418 45.588)')
on conflict (id) do update set name = excluded.name, province = excluded.province, center = excluded.center;
