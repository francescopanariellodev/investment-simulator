import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent / "pac.db"


def _connessione():
    return sqlite3.connect(DB_PATH)


def crea_database():
    with _connessione() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS simulazioni (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                investimento_mensile REAL NOT NULL,
                durata_anni REAL NOT NULL,
                capitale_finale REAL NOT NULL
            )
        """)


def salva_simulazione(dati, risultati):
    with _connessione() as conn:
        conn.execute("""
            INSERT INTO simulazioni (
                investimento_mensile,
                durata_anni,
                capitale_finale
            )
            VALUES (?, ?, ?)
        """, (
            dati["investimento_mensile"],
            dati["durata_anni"],
            risultati["capitale_finale"],
        ))


def mostra_storico(limite=5):
    with _connessione() as conn:
        righe = conn.execute("""
            SELECT id, investimento_mensile, durata_anni, capitale_finale
            FROM simulazioni
            ORDER BY id DESC
            LIMIT ?
        """, (limite,)).fetchall()

    print("\n=== ULTIME SIMULAZIONI ===")
    if not righe:
        print("Nessuna simulazione salvata.")
        return

    for riga in righe:
        print(
            f"ID: {riga[0]} | "
            f"Mensile: {riga[1]:.2f} € | "
            f"Anni: {riga[2]:.2f} | "
            f"Capitale finale: {riga[3]:.2f} €"
        )


def mostra_statistiche():
    with _connessione() as conn:
        statistiche = conn.execute("""
            SELECT
                COUNT(*),
                AVG(capitale_finale),
                MIN(capitale_finale),
                MAX(capitale_finale)
            FROM simulazioni
        """).fetchone()

    print("\n=== STATISTICHE ===")
    if not statistiche or statistiche[0] == 0:
        print("Nessuna simulazione disponibile.")
        return

    print(f"Simulazioni: {statistiche[0]}")
    print(f"Capitale medio: {statistiche[1]:.2f} €")
    print(f"Capitale minimo: {statistiche[2]:.2f} €")
    print(f"Capitale massimo: {statistiche[3]:.2f} €")


def mostra_statistiche_filtrate(minimo):
    with _connessione() as conn:
        risultato = conn.execute("""
            SELECT AVG(capitale_finale)
            FROM simulazioni
            WHERE investimento_mensile >= ?
        """, (minimo,)).fetchone()

    media = risultato[0] if risultato else None
    if media is None:
        print(f"Nessuna simulazione con investimento >= {minimo:.2f} €.")
        return

    print(
        f"Capitale finale medio con investimento "
        f">= {minimo:.2f} €: {media:.2f} €"
    )


def statistiche_per_investimento():
    with _connessione() as conn:
        righe = conn.execute("""
            SELECT
                investimento_mensile,
                durata_anni,
                COUNT(*) AS numero_simulazioni,
                AVG(capitale_finale)
            FROM simulazioni
            GROUP BY investimento_mensile, durata_anni
            HAVING COUNT(*) >= 2
            ORDER BY investimento_mensile, durata_anni
        """).fetchall()

    print("\n=== STATISTICHE PER INVESTIMENTO ===")
    if not righe:
        print("Non ci sono ancora gruppi con almeno 2 simulazioni.")
        return

    for riga in righe:
        print(
            f"Mensile: {riga[0]:.2f} € | "
            f"Anni: {riga[1]:.0f} | "
            f"Simulazioni: {riga[2]} | "
            f"Capitale medio: {riga[3]:.2f} €"
        )


def elimina_simulazione(id_simulazione):
    with _connessione() as conn:
        cursor = conn.execute("""
            DELETE FROM simulazioni
            WHERE id = ?
        """, (id_simulazione,))

    if cursor.rowcount > 0:
        print(f"Simulazione {id_simulazione} eliminata.")
        return True

    print(f"Nessuna simulazione con ID {id_simulazione}.")
    return False
