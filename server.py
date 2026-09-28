from flask import Flask, request, jsonify, send_from_directory

from calcolatore import calcolatore

app = Flask(
    __name__,
    static_folder="frontend",
    static_url_path=""
)


def _converti_percentuale(valore):
    return float(valore or 0) / 100


@app.route("/")
def home():
    return send_from_directory(
        "frontend",
        "index.html"
    )


@app.route("/preset", methods=["GET"])
def preset():
    dati = {
        "investment_type": "pac",
        "capitale_iniziale": 0.0,
        "investimento_mensile": 300.0,
        "durata_anni": 20.0,
        "percentuale_rendimento_medio": 0.07,
        "tasse_stato": 0.26,
        "inflazione_media_annuale": 0.02,
        "commissione_agenzia_finale": 0.0,
        "commissione_uscita": 0.0,
        "costi_fissi_finali": 0.0,
    }

    risultati = calcolatore(dati)
    risultati["investment_type"] = "pac"
    risultati["tax_profile"] = "Italy — standard financial capital gains"
    risultati["tax_rate_percent"] = 26.0
    return jsonify(risultati)


@app.route("/calcola", methods=["POST"])
def calcola():
    dati_frontend = request.get_json() or {}

    investment_type = str(
        dati_frontend.get("investment_type", "pac") or "pac"
    ).strip()

    if investment_type not in {"pac", "lump_sum"}:
        investment_type = "pac"

    investimento_mensile = float(
        dati_frontend.get("investimento_mensile", 0) or 0
    )

    if investment_type == "lump_sum":
        investimento_mensile = 0.0

    dati = {
        "investment_type": investment_type,

        "capitale_iniziale":
            float(dati_frontend.get("capitale_iniziale", 0) or 0),

        "investimento_mensile": investimento_mensile,

        "durata_anni":
            float(dati_frontend["durata_anni"]),

        "percentuale_rendimento_medio":
            _converti_percentuale(
                dati_frontend["percentuale_rendimento_medio"]
            ),

        "tasse_stato":
            _converti_percentuale(dati_frontend["tasse_stato"]),

        "inflazione_media_annuale":
            _converti_percentuale(
                dati_frontend["inflazione_media_annuale"]
            ),

        "commissione_agenzia_finale":
            _converti_percentuale(
                dati_frontend.get("commissione_agenzia_finale", 0)
            ),

        "commissione_uscita":
            _converti_percentuale(
                dati_frontend.get("commissione_uscita", 0)
            ),

        "costi_fissi_finali":
            float(dati_frontend.get("costi_fissi_finali", 0) or 0),
    }

    risultati = calcolatore(dati)
    risultati["investment_type"] = investment_type
    risultati["tax_profile"] = str(
        dati_frontend.get("tax_profile", "Custom tax rate") or "Custom tax rate"
    ).strip()
    risultati["tax_rate_percent"] = float(
        dati_frontend.get("tasse_stato", 0) or 0
    )
    risultati["clausole"] = str(
        dati_frontend.get("clausole", "") or ""
    ).strip()

    return jsonify(risultati)


if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )
