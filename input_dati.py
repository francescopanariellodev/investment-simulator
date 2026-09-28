def _leggi_numero(messaggio, minimo=0.0, consenti_zero=False, percentuale=False):
    while True:
        try:
            valore_testo = input(messaggio).strip().replace(",", ".")

            if percentuale:
                valore_testo = valore_testo.replace("%", "")

            valore = float(valore_testo)

            valido = valore >= minimo if consenti_zero else valore > minimo
            if not valido:
                operatore = ">=" if consenti_zero else ">"
                print(f"Inserire un numero {operatore} {minimo}.")
                continue

            return valore / 100 if percentuale else valore

        except ValueError:
            print("Inserire un numero valido.")


def inserisci_dati():
    dati = {
        "investimento_mensile": _leggi_numero(
            "Investimento mensile (€): ",
            minimo=0,
        ),
        "durata_anni": _leggi_numero(
            "Durata prevista (anni): ",
            minimo=0,
        ),
        "percentuale_rendimento_medio": _leggi_numero(
            "Rendimento medio annuo (%): ",
            minimo=0,
            consenti_zero=True,
            percentuale=True,
        ),
        "tasse_stato": _leggi_numero(
            "Tassazione sulla plusvalenza (%): ",
            minimo=0,
            consenti_zero=True,
            percentuale=True,
        ),
        "inflazione_media_annuale": _leggi_numero(
            "Inflazione media annua (%): ",
            minimo=0,
            consenti_zero=True,
            percentuale=True,
        ),
    }

    print("\n=== DATI INSERITI ===")
    print(f"Investimento mensile: {dati['investimento_mensile']:.2f} €")
    print(f"Durata: {dati['durata_anni']:.2f} anni")
    print(f"Rendimento annuo: {dati['percentuale_rendimento_medio']:.2%}")
    print(f"Tassazione: {dati['tasse_stato']:.2%}")
    print(f"Inflazione media annua: {dati['inflazione_media_annuale']:.2%}")

    return dati
