-- Cleans the Instagram share-link tracking param off Isaiah's URL in the
-- artists table, matching the clean version already used in
-- components/sections/ArtistsPreview.tsx.
update artists
set instagram_url = 'https://www.instagram.com/justsaiinked/'
where slug = 'isaiah-recongco';
