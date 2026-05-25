alter table categories
  add column if not exists sort_order integer not null default 999;

alter table teams
  add column if not exists letter text,
  add column if not exists active boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'teams_letter_check'
  ) then
    alter table teams
      add constraint teams_letter_check check (letter is null or letter in ('A', 'B', 'C', 'D'));
  end if;
end $$;

create unique index if not exists idx_teams_category_letter_unique
  on teams(category_id, coalesce(letter, ''))
  where deleted_at is null;

create unique index if not exists idx_categories_name_unique
  on categories(name);

create table if not exists team_stream_keys (
  team_id uuid not null references teams(id) on delete cascade,
  stream_key_id uuid not null references stream_keys(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, stream_key_id)
);

update categories set sort_order = 1 where name = 'Micro XS';
update categories set sort_order = 2 where name = 'Prebenjamín XS';
update categories set sort_order = 3 where name = 'Prebenjamín';
update categories set sort_order = 4 where name = 'Benjamín';
update categories set sort_order = 5 where name = 'Alevín';
update categories set sort_order = 6 where name = 'Infantil';
update categories set sort_order = 7 where name = 'Juvenil';
update categories set sort_order = 8 where name = 'Junior';
update categories set sort_order = 9 where name = 'Sub15 Femenino';
update categories set sort_order = 10 where name = 'Sub17 Femenino';
update categories set sort_order = 11 where name = '1ª Autonómica Masculina';
update categories set sort_order = 12 where name = '1ª Autonómica Femenina';
update categories set sort_order = 13 where name = 'OK Liga Masculina';
update categories set sort_order = 14 where name = 'OK Liga Plata Masculina Sur';
update categories set sort_order = 15 where name = 'OK Liga Plata Femenina';
update categories set sort_order = 16 where name = 'OK Liga Bronce Masculina Sur';

insert into categories (name, sort_order)
select 'Micro XS', 1 where not exists (select 1 from categories where name = 'Micro XS');
insert into categories (name, sort_order)
select 'Prebenjamín XS', 2 where not exists (select 1 from categories where name = 'Prebenjamín XS');
insert into categories (name, sort_order)
select 'Prebenjamín', 3 where not exists (select 1 from categories where name = 'Prebenjamín');
insert into categories (name, sort_order)
select 'Benjamín', 4 where not exists (select 1 from categories where name = 'Benjamín');
insert into categories (name, sort_order)
select 'Alevín', 5 where not exists (select 1 from categories where name = 'Alevín');
insert into categories (name, sort_order)
select 'Infantil', 6 where not exists (select 1 from categories where name = 'Infantil');
insert into categories (name, sort_order)
select 'Juvenil', 7 where not exists (select 1 from categories where name = 'Juvenil');
insert into categories (name, sort_order)
select 'Junior', 8 where not exists (select 1 from categories where name = 'Junior');
insert into categories (name, sort_order)
select 'Sub15 Femenino', 9 where not exists (select 1 from categories where name = 'Sub15 Femenino');
insert into categories (name, sort_order)
select 'Sub17 Femenino', 10 where not exists (select 1 from categories where name = 'Sub17 Femenino');
insert into categories (name, sort_order)
select '1ª Autonómica Masculina', 11 where not exists (select 1 from categories where name = '1ª Autonómica Masculina');
insert into categories (name, sort_order)
select '1ª Autonómica Femenina', 12 where not exists (select 1 from categories where name = '1ª Autonómica Femenina');
insert into categories (name, sort_order)
select 'OK Liga Masculina', 13 where not exists (select 1 from categories where name = 'OK Liga Masculina');
insert into categories (name, sort_order)
select 'OK Liga Plata Masculina Sur', 14 where not exists (select 1 from categories where name = 'OK Liga Plata Masculina Sur');
insert into categories (name, sort_order)
select 'OK Liga Plata Femenina', 15 where not exists (select 1 from categories where name = 'OK Liga Plata Femenina');
insert into categories (name, sort_order)
select 'OK Liga Bronce Masculina Sur', 16 where not exists (select 1 from categories where name = 'OK Liga Bronce Masculina Sur');
