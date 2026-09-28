from calcolatore import calcolatore
from database import (
    crea_database,
    elimina_simulazione,
    mostra_statistiche,
    mostra_statistiche_filtrate,
    mostra_storico,
    salva_simulazione,
    statistiche_per_investimento,
)
from hud import hud
from input_dati import inserisci_dati


def nuova_simulazione():
    dati = inserisci_dati()
    risultati = calcolatore(dati)
    hud(risultati)
    salva_simulazione(dati, risultati)


def menu():
    print("\n=== PAC SIMULATOR ===")
    print("1. Nuova simulazione")
    print("2. Ultime simulazioni")
    print("3. Statistiche")
    print("4. Filtra per investimento minimo")
    print("5. Statistiche per investimento")
    print("6. Elimina simulazione")
    print("0. Esci")


def main():
    crea_database()

    while True:
        menu()
        scelta = input("Scelta: ").strip()

        if scelta == "1":
            nuova_simulazione()

        elif scelta == "2":
            mostra_storico()

        elif scelta == "3":
            mostra_statistiche()

        elif scelta == "4":
            try:
                minimo = float(
                    input("Investimento minimo (€): ")
                    .strip()
                    .replace(",", ".")
                )
                mostra_statistiche_filtrate(minimo)
            except ValueError:
                print("Inserire un numero valido.")

        elif scelta == "5":
            statistiche_per_investimento()

        elif scelta == "6":
            try:
                id_simulazione = int(input("ID simulazione da eliminare: "))
                elimina_simulazione(id_simulazione)
            except ValueError:
                print("Inserire un ID numerico valido.")

        elif scelta == "0":
            print("Chiusura PAC Simulator.")
            break

        else:
            print("Scelta non valida.")


if __name__ == "__main__":
    main()
