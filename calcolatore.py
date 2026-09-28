def calcolatore(dati):
    """Calculate either a recurring PAC or lump-sum investment simulation.

    A lump-sum plan is represented by ``capitale_iniziale`` with a monthly
    contribution of zero. Percentages in ``dati`` are decimal values:
    7% -> 0.07.
    """
    capitale_iniziale = max(0.0, dati.get("capitale_iniziale", 0.0))
    investimento_mensile = max(0.0, dati["investimento_mensile"])
    durata_anni = max(0.1, dati["durata_anni"])
    rendimento_annuo = dati["percentuale_rendimento_medio"]
    tasse_stato = max(0.0, dati["tasse_stato"])
    inflazione_annua = max(0.0, dati["inflazione_media_annuale"])

    commissione_agenzia_finale = max(
        0.0,
        dati.get("commissione_agenzia_finale", 0.0)
    )
    commissione_uscita = max(
        0.0,
        dati.get("commissione_uscita", 0.0)
    )
    costi_fissi_finali = max(
        0.0,
        dati.get("costi_fissi_finali", 0.0)
    )

    mesi = max(1, round(durata_anni * 12))
    durata_effettiva_anni = mesi / 12
    rendimento_mensile = (1 + rendimento_annuo) ** (1 / 12) - 1

    capitale_investito = capitale_iniziale + investimento_mensile * mesi

    capitale_lordo = capitale_iniziale * ((1 + rendimento_mensile) ** mesi)

    if abs(rendimento_mensile) < 1e-12:
        capitale_lordo += investimento_mensile * mesi
    else:
        capitale_lordo += investimento_mensile * (
            ((1 + rendimento_mensile) ** mesi - 1)
            / rendimento_mensile
        )

    interesse_maturato = capitale_lordo - capitale_investito
    tasse_da_pagare = max(0.0, interesse_maturato) * tasse_stato
    capitale_netto_tasse = capitale_lordo - tasse_da_pagare

    costo_agenzia = capitale_netto_tasse * commissione_agenzia_finale
    costo_uscita = capitale_netto_tasse * commissione_uscita
    costi_intermediario = costo_agenzia + costo_uscita + costi_fissi_finali

    capitale_netto_finale = max(
        0.0,
        capitale_netto_tasse - costi_intermediario
    )

    fattore_inflazione = (1 + inflazione_annua) ** durata_effettiva_anni
    capitale_reale = capitale_netto_finale / fattore_inflazione

    capitale_lordo_progressivo = capitale_iniziale
    capitale_investito_progressivo = capitale_iniziale

    punto_iniziale = {
        "anno": 0,
        "capitale_investito": round(capitale_iniziale, 2),
        "capitale_finale": round(capitale_iniziale, 2),
        "interesse_maturato": 0.0,
        "tasse_da_pagare": 0.0,
        "costi_intermediario": round(costi_fissi_finali, 2) if capitale_iniziale > 0 else 0.0,
        "capitale_netto_finale": round(max(0.0, capitale_iniziale - costi_fissi_finali), 2),
        "capitale_reale": round(max(0.0, capitale_iniziale - costi_fissi_finali), 2),
    }

    serie_annuale = [punto_iniziale.copy()]
    # Monthly points power the interactive crosshair in the browser.
    serie_temporale = [punto_iniziale.copy()]

    for mese in range(1, mesi + 1):
        capitale_lordo_progressivo = (
            capitale_lordo_progressivo * (1 + rendimento_mensile)
            + investimento_mensile
        )
        capitale_investito_progressivo += investimento_mensile

        interesse_progressivo = (
            capitale_lordo_progressivo - capitale_investito_progressivo
        )
        tasse_progressive = max(0.0, interesse_progressivo) * tasse_stato
        netto_tasse_progressivo = capitale_lordo_progressivo - tasse_progressive

        costi_percentuali_progressivi = netto_tasse_progressivo * (
            commissione_agenzia_finale + commissione_uscita
        )
        costi_intermediario_progressivi = (
            costi_percentuali_progressivi + costi_fissi_finali
        )
        netto_finale_progressivo = max(
            0.0,
            netto_tasse_progressivo - costi_intermediario_progressivi
        )

        anni_progressivi = mese / 12
        fattore_inflazione_progressivo = (
            (1 + inflazione_annua) ** anni_progressivi
        )
        capitale_reale_progressivo = (
            netto_finale_progressivo / fattore_inflazione_progressivo
        )

        punto = {
            "anno": round(anni_progressivi, 4),
            "capitale_investito": round(capitale_investito_progressivo, 2),
            "capitale_finale": round(capitale_lordo_progressivo, 2),
            "interesse_maturato": round(interesse_progressivo, 2),
            "tasse_da_pagare": round(tasse_progressive, 2),
            "costi_intermediario": round(costi_intermediario_progressivi, 2),
            "capitale_netto_finale": round(netto_finale_progressivo, 2),
            "capitale_reale": round(capitale_reale_progressivo, 2),
        }

        serie_temporale.append(punto)

        if mese % 12 == 0 or mese == mesi:
            serie_annuale.append(punto.copy())

    return {
        "mesi": mesi,
        "capitale_investito": capitale_investito,
        "capitale_finale": capitale_lordo,
        "interesse_maturato": interesse_maturato,
        "tasse_da_pagare": tasse_da_pagare,
        "capitale_netto_tasse": capitale_netto_tasse,
        "costi_intermediario": costi_intermediario,
        "capitale_netto_finale": capitale_netto_finale,
        "capitale_reale": capitale_reale,
        "serie_annuale": serie_annuale,
        "serie_temporale": serie_temporale,
    }
