def hud(risultati):
    print("\n=== RISULTATO PIANO DI ACCUMULO ===")
    print(f"Capitale versato: {risultati['capitale_investito']:.2f} €")
    print(f"Capitale finale lordo: {risultati['capitale_finale']:.2f} €")
    print(f"Plusvalenza maturata: {risultati['interesse_maturato']:.2f} €")
    print(f"Imposte stimate sulla plusvalenza: {risultati['tasse_da_pagare']:.2f} €")
    print(f"Capitale netto dopo le imposte: {risultati['capitale_netto_tasse']:.2f} €")
    print(f"Potere d'acquisto finale (inflazione): {risultati['capitale_reale']:.2f} €")
