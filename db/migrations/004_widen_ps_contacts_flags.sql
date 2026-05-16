ALTER TABLE ps_contacts
  ALTER COLUMN authenticate_qualify TYPE varchar(10),
  ALTER COLUMN prune_on_boot TYPE varchar(10),
  ALTER COLUMN qualify_2xx_only TYPE varchar(10);
