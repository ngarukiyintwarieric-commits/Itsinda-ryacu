# ITSINDA RYACU v0.6 — Intambwe zo gukomeza

## Ibyongewe muri iyi verisiyo
- Kwandika abanyamuryango n'imibare ya buri wese.
- Kwandika umusanzu, kuwemeza no kureba amafaranga yemejwe n'asigaye.
- Gushyiraho itariki yo gusoza itsinda no kubona iminsi isigaye.
- Kwandika itangazo rigenewe abanyamuryango bose no kohereza SMS ukoresheje Twilio Edge Function.
- Gukomeza kubamo ibyo twari twumvikanyeho muri v0.5: OTP, ibihano n'igerageza ry'amezi 3.

## Icyitonderwa
Iyi ni verisiyo y'igerageza. SMS ntizoherezwa kugeza Edge Function na Twilio byashyizweho. Kwibutsa itsinda mu buryo bwikora ku itariki yo gusoza ntibirimo scheduler; app ibika itariki kandi ikabara iminsi isigaye.

## Uko wongeramo imbonerahamwe nshya muri Supabase
1. Banza ubike kopi y'umutekano (backup) y'amakuru yawe.
2. Fungura Supabase project ya ITSINDA RYACU.
3. Fungura SQL Editor, ukore query nshya.
4. Fungura dosiye `supabase/migration_v06_members_announcements.sql`, ukoporore SQL yose uyishyire muri SQL Editor.
5. Banza usome SQL, hanyuma ukande Run rimwe. Ntusubire gukoresha `schema.sql` kuri project isanzwe.
6. Garuka muri app, fungura igice `Abanyamuryango`, uhitemo itsinda, wongereho umunyamuryango w'igerageza.

## Gushyiraho SMS
1. Shyiraho/deploy Edge Function iri muri `supabase/functions/send-group-announcement/index.ts` ifite izina `send-group-announcement`.
2. Shyiramo secrets kuri Supabase Edge Functions: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
3. Ntushyire `SUPABASE_SERVICE_ROLE_KEY` cyangwa `TWILIO_AUTH_TOKEN` muri code ya frontend, `.env` igaragara ku bakoresha, cyangwa ubutumwa bwo kuganira.
4. Gerageza n'itsinda rito n'imero zawe mbere yo kohereza SMS ku bantu bose. SMS ishobora kugira ikiguzi.

## Imipaka y'ubu
- Abanyamuryango bandikwa muri directory y'itsinda; konti zabo za login ntizihita zihuza n'iyo directory.
- Amafaranga ateganyijwe abarwa hashingiwe ku musanzu wa buri kwezi n'amezi kuva umunyamuryango yinjiye. Amatsinda afite amategeko atandukanye agomba kugenzura imibare.
- Igihe cyo gusoza kibarwa muri app, ariko kwibutsa kuri SMS byikora bisaba cron/scheduler itarashyirwaho.
- Ubutumwa bwemewe na Twilio ntabwo buri gihe buvuga ko bwageze kuri telefone; delivery receipts ziterwa na provider.
- Build yuzuye n'igerageza nyaryo kuri Supabase/Twilio ntibirarangira muri iyi environment.
