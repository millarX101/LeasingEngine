-- 1  staging table (first 30 cols as text)
DROP TABLE IF EXISTS stage_cq;
CREATE UNLOGGED TABLE stage_cq (
  col1  text, col2  text, col3  text, col4  text, col5  text,
  col6  text, col7  text, col8  text, col9  text, col10 text,
  col11 text, col12 text, col13 text, col14 text, col15 text,
  col16 text, col17 text, col18 text, col19 text, col20 text,
  col21 text, col22 text, col23 text, col24 text, col25 text,
  col26 text, col27 text, col28 text, col29 text, col30 text
);

-- 2  load the CSV
COPY stage_cq FROM '/tmp/CQA_Premium.csv'
WITH (FORMAT csv, HEADER true, NULL 'NULL');

-- 3  destination table
DROP TABLE IF EXISTS vehicle_specs;
CREATE TABLE vehicle_specs (
  make      text,
  model     text,
  trim      text,
  year      int,
  body      text,
  lkm_city  numeric,
  lkm_hwy   numeric
);

-- 4  populate from staging
INSERT INTO vehicle_specs (make, model, trim, year, body, lkm_city, lkm_hwy)
SELECT
  col2                          AS make,
  col3                          AS model,
  col4                          AS trim,
  col5::int                     AS year,
  col6                          AS body,
  NULLIF(col28,'NULL')::numeric AS lkm_city,
  NULLIF(col29,'NULL')::numeric AS lkm_hwy
FROM stage_cq;

-- 5  tidy up
DROP TABLE stage_cq;
CREATE INDEX idx_vehicle_specs_mm ON vehicle_specs (make, model, year);
