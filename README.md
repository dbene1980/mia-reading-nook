# Mia Reading Nook

"Crea un'app web moderna, pulita e responsive per gestire la mia libreria personale collegata al mio progetto Supabase. Usa un tema scuro elegante con sidebar a sinistra ('Home', 'Da leggere', 'Libri letti') e un pulsante in alto a destra per esportare tutti i dati in formato CSV.

1. Autenticazione: Aggiungi una schermata di Login con email e password gestita tramite Supabase Auth. Disabilita la registrazione pubblica (oppure fai in modo che ogni utente veda solo i propri libri tramite Row Level Security) così i miei dati restano privati.

2. Tabella Database (books): Crea la tabella su Supabase con queste colonne: - id (uuid, primary key) - user_id (uuid, collegato all'utente loggato) - titolo (text, obbligatorio) - autore (text) - STATO  (text: 'SCARICATO', 'DA SCARICARE', 'DA COMPRARE', 'NON TROVATO') - descrizione (text) - note (text) - letto (boolean, default false) - data_fine_libro (timestamp) - rating (integer, da 1 a 5) - tipo (text: 'LIBRO', 'EBOOK', 'AUDIOLIBRO') - copertina_url (text)

3. Vista 'Da leggere' (letto = false): barra di ricerca per titolo/autore, filtro per stato_acquisto, pulsante '+ Aggiungi libro' e lista/card dei libri. Cliccando su un libro si apre un pannello/modale per modificarne i dettagli, con un pulsante verde evidente 'Segna come letto': cliccandolo si apre una finestra rapida per confermare data_fine_libro (precompilata con data e ora di oggi), scegliere rating (stelle da 1 a 5), tipo e aggiungere note, spostando il libro in 'Libri letti'.

4. Vista 'Libri letti' (letto = true): barra di ricerca, filtri per tipo e rating, elenco ordinato dal più recente con Titolo, Data fine libro, stelle del Rating, badge Tipo, Note e pulsante per modificare o riportare in 'Da leggere'.

5. Vista 'Home': dashboard con il totale dei libri letti, i libri letti nell'anno corrente, quelli da leggere e gli ultimi 3 libri aggiunti o completati."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mia-reading-nook.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bf915fd8-9ae8-46cc-8f48-bc902643e8f2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
