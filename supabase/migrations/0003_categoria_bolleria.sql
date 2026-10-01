-- Quadro Café — Reunión 05/sept, punto 14: la categoría "Panadería" pasa a
-- llamarse "Bollería". Solo cambia el nombre de la categoría: mismos productos,
-- mismo orden, mismo banner.
--
-- CUÁNDO CORRERLA: en el mismo momento del merge a main de la rama
-- quadro-feature-reunion-05sept, NO antes. El código viejo (el que está en
-- prod hasta el merge) filtra la Carta por CATS = [..., "Panadería", ...]; si
-- esta migración corre antes, esos productos dejan de verse en la Carta y en
-- el Panel Admin hasta que llegue el deploy nuevo. Al revés (deploy primero,
-- migración unos minutos después) el efecto es el mismo pero en el otro
-- sentido — por eso conviene correrla apenas termine el deploy.
--
-- Cómo aplicarla: SQL Editor del dashboard de Supabase → pegar y ejecutar.
-- Es idempotente (correrla dos veces no hace nada la segunda vez).

update productos set cat = 'Bollería' where cat = 'Panadería';
