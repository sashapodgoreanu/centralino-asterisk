ALTER TABLE ps_contacts
  ADD COLUMN IF NOT EXISTS qualify_2xx_only varchar(3);
