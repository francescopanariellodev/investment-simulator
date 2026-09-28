const form = document.getElementById("pac-form");
const schermataForm = document.getElementById("schermata-form");
const sezioneRisultati = document.getElementById("risultati");
const bottoneNuovaSimulazione = document.getElementById("nuova-simulazione");
const usaAgenzia = document.getElementById("usa-agenzia");
const agencyFields = document.getElementById("agency-fields");
const clausoleRiepilogo = document.getElementById("clausole-riepilogo");
const clausoleTesto = document.getElementById("clausole-testo");

const investmentMethodInputs = document.querySelectorAll('input[name="investment-method"]');
const monthlyContributionGroup = document.getElementById("monthly-contribution-group");
const capitaleInizialeLabel = document.getElementById("capitale-iniziale-label");
const taxPreset = document.getElementById("tax-preset");
const taxPresetNote = document.getElementById("tax-preset-note");
const taxRateHidden = document.getElementById("tasse");
const customTaxGroup = document.getElementById("custom-tax-group");
const customTaxRate = document.getElementById("custom-tax-rate");
const formError = document.getElementById("form-error");
const resultMethodChip = document.getElementById("result-method-chip");
const resultTaxChip = document.getElementById("result-tax-chip");

const previewCanvas = document.getElementById("grafico-preview");
const resultCanvas = document.getElementById("grafico-simulazione");
const previewLegend = document.getElementById("legenda-preview");
const resultLegend = document.getElementById("legenda-grafico");
const summarySection = document.getElementById("summary");
const summaryFeesCard = document.getElementById("summary-fees-card");
const previewTooltip = document.getElementById("tooltip-preview");
const resultTooltip = document.getElementById("tooltip-result");
const timelineControls = document.querySelectorAll(".timeline-toggle");

const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();
const CURRENT_MONTH = CURRENT_DATE.getMonth();
const chartStates = new Map();
let timeLabelMode = "relative";

const formatoEuro = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2
});

const formatoCompatto = new Intl.NumberFormat("en-IE", {
    notation: "compact",
    maximumFractionDigits: 1
});

const formatoPercentuale = new Intl.NumberFormat("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const taxNotes = {
    "Italy — standard financial capital gains":
        "26% simplified standard rate for many financial capital gains of Italian-resident individuals. Some assets, including qualifying government bonds, can follow different rules.",

    "United States — federal long-term capital gains 0% bracket":
        "Federal long-term capital-gains rate only. The applicable 0% / 15% / 20% bracket depends on taxable income and filing status; NIIT and state taxes are not included.",

    "United States — federal long-term capital gains 15% bracket":
        "Federal long-term capital-gains rate only. The applicable 0% / 15% / 20% bracket depends on taxable income and filing status; NIIT and state taxes are not included.",

    "United States — federal long-term capital gains 20% bracket":
        "Federal long-term capital-gains rate only. The applicable 0% / 15% / 20% bracket depends on taxable income and filing status; NIIT and state taxes are not included.",

    "France — PFU on securities capital gains":
        "PFU reference for securities capital gains: 31.4% (12.8% income tax + 18.6% social levies), based on the French tax authority page updated in July 2026.",

    "Germany — 25% capital income tax + solidarity surcharge":
        "Approx. 26.375% = 25% capital income tax plus a 5.5% solidarity surcharge on that tax. Church tax and fund-specific exemptions are not included.",

    "United Kingdom — individual lower CGT rate":
        "18% individual Capital Gains Tax rate from 6 April 2026. The actual rate depends on income and the amount of taxable gains; allowances and special rules are not modeled.",

    "United Kingdom — individual higher CGT rate":
        "24% individual Capital Gains Tax rate from 6 April 2026. The actual rate depends on income and the amount of taxable gains; allowances and special rules are not modeled.",

    "Switzerland — private movable capital gains":
        "Private capital gains on movable private assets are generally tax-free for private investors. Professional trading and other taxes can change the treatment.",

    "Custom tax rate":
        "Enter your own simplified effective capital-gains tax rate. The simulator applies it to positive investment gains at the end of the horizon."
};

const serieConfig = [
    {
        key: "capitale_investito",
        label: "Total invested",
        color: "#69a4ff"
    },
    {
        key: "capitale_finale",
        label: "Gross final value",
        color: "#79e0b5"
    },
    {
        key: "interesse_maturato",
        label: "Investment gains",
        color: "#f5c36d"
    },
    {
        key: "tasse_da_pagare",
        label: "Taxes",
        color: "#ff7f87"
    },
    {
        key: "costi_intermediario",
        label: "Agency / exit costs",
        color: "#ff9f5a"
    },
    {
        key: "capitale_netto_finale",
        label: "Net final value",
        color: "#b295ff"
    },
    {
        key: "capitale_reale",
        label: "Real purchasing power",
        color: "#59d8f2"
    }
];

let previewSeries = [];
let resultSeries = [];

function metodoInvestimento() {
    const selezionato = document.querySelector('input[name="investment-method"]:checked');
    return selezionato ? selezionato.value : "pac";
}

function parseNumeroTesto(value) {
    const pulito = String(value ?? "")
        .trim()
        .replace(/\s/g, "")
        .replace(",", ".");

    if (pulito === "") {
        return NaN;
    }

    const numero = Number(pulito);
    return Number.isFinite(numero) ? numero : NaN;
}

function valoreNumerico(id) {
    return parseNumeroTesto(document.getElementById(id).value);
}

function mostraErrore(messaggio) {
    formError.textContent = messaggio;
    formError.classList.remove("nascosto");
}

function nascondiErrore() {
    formError.textContent = "";
    formError.classList.add("nascosto");
}

function aggiornaMetodoInvestimento() {
    const metodo = metodoInvestimento();

    if (metodo === "lump_sum") {
        monthlyContributionGroup.classList.add("nascosto");
        capitaleInizialeLabel.innerHTML = "One-time investment";
    } else {
        monthlyContributionGroup.classList.remove("nascosto");
        capitaleInizialeLabel.innerHTML = 'Initial capital <span class="label-muted">(optional)</span>';
    }

    nascondiErrore();
}

function taxProfileSelezionato() {
    const option = taxPreset.options[taxPreset.selectedIndex];
    return option?.dataset.profile || "Custom tax rate";
}

function aggiornaTaxPreset() {
    const option = taxPreset.options[taxPreset.selectedIndex];
    const custom = option.value === "custom";

    customTaxGroup.classList.toggle("nascosto", !custom);

    if (custom) {
        const customValue = parseNumeroTesto(customTaxRate.value);
        taxRateHidden.value = Number.isFinite(customValue) ? customValue : 0;
    } else {
        taxRateHidden.value = option.value;
    }

    taxPresetNote.textContent = taxNotes[taxProfileSelezionato()] || "Simplified tax preset.";
    nascondiErrore();
}

function taxRateEffettiva() {
    const option = taxPreset.options[taxPreset.selectedIndex];

    if (option.value === "custom") {
        return parseNumeroTesto(customTaxRate.value);
    }

    return parseNumeroTesto(option.value);
}

function validaDati(dati) {
    if (!Number.isFinite(dati.capitale_iniziale) || dati.capitale_iniziale < 0) {
        return "Enter a valid investment amount equal to or greater than zero.";
    }

    if (dati.investment_type === "pac") {
        if (!Number.isFinite(dati.investimento_mensile) || dati.investimento_mensile < 0) {
            return "Enter a valid monthly contribution equal to or greater than zero.";
        }

        if (dati.capitale_iniziale <= 0 && dati.investimento_mensile <= 0) {
            return "A recurring plan needs an initial capital or a monthly contribution greater than zero.";
        }
    } else if (dati.capitale_iniziale <= 0) {
        return "A lump-sum simulation needs a one-time investment greater than zero.";
    }

    if (!Number.isFinite(dati.durata_anni) || dati.durata_anni < 0.1) {
        return "Investment horizon must be at least 0.1 years.";
    }

    if (!Number.isFinite(dati.percentuale_rendimento_medio) || dati.percentuale_rendimento_medio < 0) {
        return "Expected annual return must be zero or greater.";
    }

    if (!Number.isFinite(dati.tasse_stato) || dati.tasse_stato < 0 || dati.tasse_stato > 100) {
        return "Capital-gains tax must be between 0% and 100%.";
    }

    if (!Number.isFinite(dati.inflazione_media_annuale) || dati.inflazione_media_annuale < 0) {
        return "Expected annual inflation must be zero or greater.";
    }

    const optionalValues = [
        dati.commissione_agenzia_finale,
        dati.commissione_uscita,
        dati.costi_fissi_finali
    ];

    if (optionalValues.some(function (value) {
        return !Number.isFinite(value) || value < 0;
    })) {
        return "Agency fees and fixed costs must be valid non-negative numbers.";
    }

    return "";
}

function serieVisibili(serie) {
    return serieConfig.filter(function (config) {
        if (config.key !== "costi_intermediario") {
            return true;
        }

        return serie.some(function (punto) {
            return Math.abs(punto[config.key] || 0) > 0.005;
        });
    });
}

function creaLegenda(contenitore, serie) {
    contenitore.innerHTML = "";

    serieVisibili(serie).forEach(function (config) {
        const item = document.createElement("div");
        item.className = "legend-item";

        const dot = document.createElement("span");
        dot.className = "legend-color";
        dot.style.backgroundColor = config.color;
        dot.style.color = config.color;

        const testo = document.createElement("span");
        testo.textContent = config.label;

        item.appendChild(dot);
        item.appendChild(testo);
        contenitore.appendChild(item);
    });
}

function formatRelativeTime(anni, dettagliato = false) {
    const mesiTotali = Math.max(0, Math.round(Number(anni || 0) * 12));
    const anniInteri = Math.floor(mesiTotali / 12);
    const mesi = mesiTotali % 12;

    if (!dettagliato || mesi === 0) {
        return "+" + anniInteri + "y";
    }

    if (anniInteri === 0) {
        return "+" + mesi + "m";
    }

    return "+" + anniInteri + "y " + mesi + "m";
}

function calendarDateFromYears(anni) {
    const mesi = Math.max(0, Math.round(Number(anni || 0) * 12));
    return new Date(CURRENT_YEAR, CURRENT_MONTH + mesi, 1);
}

function formatTimelineLabel(anni, dettagliato = false) {
    if (timeLabelMode === "calendar") {
        const date = calendarDateFromYears(anni);

        if (dettagliato) {
            return new Intl.DateTimeFormat("en-GB", {
                month: "short",
                year: "numeric"
            }).format(date);
        }

        return String(date.getFullYear());
    }

    return formatRelativeTime(anni, dettagliato);
}

function seriePerTarget(target) {
    return target === "preview" ? previewSeries : resultSeries;
}

function canvasPerTarget(target) {
    return target === "preview" ? previewCanvas : resultCanvas;
}

function aggiornaTimelineControl(target, serie) {
    const control = document.querySelector('.timeline-toggle[data-chart-target="' + target + '"]');
    if (!control) {
        return;
    }

    const lastYear = Array.isArray(serie) && serie.length
        ? Number(serie[serie.length - 1].anno) || 0
        : 20;

    const relativeButton = control.querySelector('[data-time-mode="relative"]');
    const calendarButton = control.querySelector('[data-time-mode="calendar"]');

    if (relativeButton) {
        relativeButton.textContent = "Relative · " + formatRelativeTime(lastYear, false);
    }

    if (calendarButton) {
        const calendarYear = calendarDateFromYears(lastYear).getFullYear();
        calendarButton.textContent = "Calendar · " + calendarYear;
    }

    control.querySelectorAll(".timeline-option").forEach(function (button) {
        button.classList.toggle("active", button.dataset.timeMode === timeLabelMode);
    });
}

function aggiornaTuttiTimelineControl() {
    aggiornaTimelineControl("preview", previewSeries);
    aggiornaTimelineControl("result", resultSeries.length ? resultSeries : previewSeries);
}

function renderTooltip(tooltip, punto, configs, xPos, canvasWidth) {
    if (!tooltip || !punto) {
        return;
    }

    const rows = configs.map(function (config) {
        const valore = Number(punto[config.key]) || 0;
        return '<div class="chart-tooltip-row">' +
            '<span class="chart-tooltip-dot" style="background:' + config.color + '"></span>' +
            '<span>' + config.label + '</span>' +
            '<strong>' + formatoEuro.format(valore) + '</strong>' +
        '</div>';
    }).join("");

    const mesi = Math.max(0, Math.round((Number(punto.anno) || 0) * 12));
    tooltip.innerHTML =
        '<div class="chart-tooltip-title">' +
            '<span>' + formatTimelineLabel(punto.anno, true) + '</span>' +
            '<small>Month ' + mesi + '</small>' +
        '</div>' + rows;

    tooltip.classList.add("visible");
    tooltip.setAttribute("aria-hidden", "false");

    const tooltipWidth = Math.min(300, tooltip.offsetWidth || 250);
    let left = xPos + 14;

    if (left + tooltipWidth > canvasWidth - 10) {
        left = Math.max(10, xPos - tooltipWidth - 14);
    }

    tooltip.style.left = left + "px";
    tooltip.style.top = "14px";
}

function nascondiTooltip(tooltip) {
    if (!tooltip) {
        return;
    }

    tooltip.classList.remove("visible");
    tooltip.setAttribute("aria-hidden", "true");
}

function disegnaGrafico(canvas, serie) {
    if (!Array.isArray(serie) || serie.length < 2) {
        return;
    }

    const oldState = chartStates.get(canvas) || {};
    const hoverIndex = Number.isInteger(oldState.hoverIndex) ? oldState.hoverIndex : null;
    const ctx = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(300, rect.height);

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const padding = {
        top: 28,
        right: 24,
        bottom: 48,
        left: 78
    };

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const lastYear = Math.max(Number(serie[serie.length - 1].anno) || 1, 1);
    const configs = serieVisibili(serie);

    let maxY = 0;
    serie.forEach(function (punto) {
        configs.forEach(function (config) {
            maxY = Math.max(maxY, Number(punto[config.key]) || 0);
        });
    });

    maxY = Math.max(maxY, 1) * 1.08;

    const x = function (anno) {
        return padding.left + (Number(anno || 0) / lastYear) * plotWidth;
    };

    const y = function (valore) {
        return padding.top + plotHeight - (Number(valore || 0) / maxY) * plotHeight;
    };

    ctx.font = "12px Inter, Arial, sans-serif";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= 5; i += 1) {
        const valore = (maxY / 5) * i;
        const yPos = y(valore);

        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, yPos);
        ctx.lineTo(width - padding.right, yPos);
        ctx.stroke();

        ctx.fillStyle = "#71829a";
        ctx.textAlign = "left";
        ctx.fillText("€ " + formatoCompatto.format(valore), 10, yPos);
    }

    const xTicks = 5;
    for (let i = 0; i <= xTicks; i += 1) {
        const anno = (lastYear / xTicks) * i;
        const xPos = x(anno);

        ctx.strokeStyle = "rgba(255,255,255,0.035)";
        ctx.beginPath();
        ctx.moveTo(xPos, padding.top);
        ctx.lineTo(xPos, height - padding.bottom);
        ctx.stroke();

        ctx.fillStyle = "#71829a";
        ctx.textAlign = "center";
        ctx.fillText(formatTimelineLabel(anno, false), xPos, height - 18);
    }

    ctx.textAlign = "left";

    configs.forEach(function (config) {
        ctx.beginPath();
        ctx.lineWidth = config.key === "capitale_netto_finale" ? 3 : 2.2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = config.color;

        serie.forEach(function (punto, indice) {
            const px = x(punto.anno);
            const py = y(Number(punto[config.key]) || 0);

            if (indice === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        });

        ctx.stroke();

        const ultimo = serie[serie.length - 1];
        const px = x(ultimo.anno);
        const py = y(Number(ultimo[config.key]) || 0);

        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(px, py, config.key === "capitale_netto_finale" ? 4.5 : 3.3, 0, Math.PI * 2);
        ctx.fill();
    });

    if (hoverIndex !== null && serie[hoverIndex]) {
        const punto = serie[hoverIndex];
        const hoverX = x(punto.anno);

        ctx.save();
        ctx.strokeStyle = "rgba(235, 243, 255, 0.68)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(hoverX, padding.top);
        ctx.lineTo(hoverX, height - padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        configs.forEach(function (config) {
            const hoverY = y(Number(punto[config.key]) || 0);
            ctx.fillStyle = config.color;
            ctx.beginPath();
            ctx.arc(hoverX, hoverY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(7, 14, 25, 0.95)";
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        ctx.restore();
    }

    chartStates.set(canvas, {
        serie: serie,
        configs: configs,
        padding: padding,
        plotWidth: plotWidth,
        plotHeight: plotHeight,
        lastYear: lastYear,
        width: width,
        height: height,
        hoverIndex: hoverIndex,
        x: x,
        y: y
    });
}

function nearestPointIndex(serie, targetYear) {
    let bestIndex = 0;
    let bestDistance = Infinity;

    serie.forEach(function (punto, index) {
        const distance = Math.abs((Number(punto.anno) || 0) - targetYear);
        if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = index;
        }
    });

    return bestIndex;
}

function setupInteractiveChart(canvas, tooltip) {
    const aggiornaDaEvento = function (event) {
        const state = chartStates.get(canvas);
        if (!state || !state.serie || state.serie.length === 0) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const clampedX = Math.min(
            state.width - state.padding.right,
            Math.max(state.padding.left, localX)
        );
        const targetYear = ((clampedX - state.padding.left) / state.plotWidth) * state.lastYear;
        const index = nearestPointIndex(state.serie, targetYear);

        state.hoverIndex = index;
        chartStates.set(canvas, state);
        disegnaGrafico(canvas, state.serie);

        const refreshed = chartStates.get(canvas);
        const punto = refreshed.serie[index];
        const snappedX = refreshed.x(punto.anno);
        renderTooltip(tooltip, punto, refreshed.configs, snappedX, refreshed.width);
    };

    canvas.addEventListener("pointermove", aggiornaDaEvento);
    canvas.addEventListener("pointerdown", aggiornaDaEvento);

    canvas.addEventListener("pointerleave", function () {
        const state = chartStates.get(canvas);
        if (!state) {
            return;
        }

        state.hoverIndex = null;
        chartStates.set(canvas, state);
        nascondiTooltip(tooltip);
        disegnaGrafico(canvas, state.serie);
    });
}

function aggiornaRisultati(risultati) {
    document.getElementById("capitale-finale").textContent =
        formatoEuro.format(risultati.capitale_finale);

    document.getElementById("capitale-investito").textContent =
        formatoEuro.format(risultati.capitale_investito);

    document.getElementById("interessi-maturati").textContent =
        formatoEuro.format(risultati.interesse_maturato);

    document.getElementById("tasse-pagare").textContent =
        formatoEuro.format(risultati.tasse_da_pagare);

    document.getElementById("costi-intermediario").textContent =
        formatoEuro.format(risultati.costi_intermediario || 0);

    document.getElementById("capitale-netto").textContent =
        formatoEuro.format(risultati.capitale_netto_finale);

    document.getElementById("capitale-reale").textContent =
        formatoEuro.format(risultati.capitale_reale);

    resultMethodChip.textContent = risultati.investment_type === "lump_sum"
        ? "Lump sum"
        : "Recurring plan (PAC)";

    const taxRate = Number(risultati.tax_rate_percent) || 0;
    resultTaxChip.textContent = (risultati.tax_profile || "Tax") + " · " +
        formatoPercentuale.format(taxRate) + "%";

    if (risultati.clausole) {
        clausoleTesto.textContent = risultati.clausole;
        clausoleRiepilogo.classList.remove("nascosto");
    } else {
        clausoleTesto.textContent = "";
        clausoleRiepilogo.classList.add("nascosto");
    }
}

function aggiornaSummary(risultati) {
    const gross = Number(risultati.capitale_finale) || 0;
    const taxes = Number(risultati.tasse_da_pagare) || 0;
    const fees = Number(risultati.costi_intermediario) || 0;
    const nominalNet = Number(risultati.capitale_netto_finale) || 0;
    const real = Number(risultati.capitale_reale) || 0;
    const inflationLoss = Math.max(0, nominalNet - real);
    const taxInflationLoss = taxes + inflationLoss;

    const percentOfGross = function (value) {
        if (gross <= 0) {
            return 0;
        }
        return (value / gross) * 100;
    };

    document.getElementById("summary-invested").textContent =
        formatoEuro.format(risultati.capitale_investito || 0);

    document.getElementById("summary-gross").textContent =
        formatoEuro.format(gross);

    document.getElementById("summary-real").textContent =
        formatoEuro.format(real);

    document.getElementById("summary-taxes").textContent =
        formatoEuro.format(taxes);
    document.getElementById("summary-taxes-percent").textContent =
        formatoPercentuale.format(percentOfGross(taxes)) + "%";

    document.getElementById("summary-inflation").textContent =
        formatoEuro.format(inflationLoss);
    document.getElementById("summary-inflation-percent").textContent =
        formatoPercentuale.format(percentOfGross(inflationLoss)) + "%";

    document.getElementById("summary-total-drag").textContent =
        formatoEuro.format(taxInflationLoss);
    document.getElementById("summary-total-drag-percent").textContent =
        formatoPercentuale.format(percentOfGross(taxInflationLoss)) + "%";

    document.getElementById("summary-fees").textContent =
        formatoEuro.format(fees);
    document.getElementById("summary-fees-percent").textContent =
        formatoPercentuale.format(percentOfGross(fees)) + "%";

    summaryFeesCard.classList.toggle("nascosto", fees <= 0.005);
    summarySection.classList.remove("nascosto");
}

async function caricaPreset() {
    try {
        const risposta = await fetch("/preset");

        if (!risposta.ok) {
            throw new Error("Preset HTTP: " + risposta.status);
        }

        const preset = await risposta.json();
        previewSeries = preset.serie_temporale || preset.serie_annuale || [];

        document.getElementById("preview-finale").textContent =
            formatoEuro.format(preset.capitale_finale);
        document.getElementById("preview-investito").textContent =
            formatoEuro.format(preset.capitale_investito);
        document.getElementById("preview-reale").textContent =
            formatoEuro.format(preset.capitale_reale);

        creaLegenda(previewLegend, previewSeries);
        aggiornaTimelineControl("preview", previewSeries);

        requestAnimationFrame(function () {
            disegnaGrafico(previewCanvas, previewSeries);
        });
    } catch (errore) {
        console.error("Preset loading error:", errore);
    }
}

investmentMethodInputs.forEach(function (input) {
    input.addEventListener("change", aggiornaMetodoInvestimento);
});

taxPreset.addEventListener("change", aggiornaTaxPreset);
customTaxRate.addEventListener("input", aggiornaTaxPreset);

usaAgenzia.addEventListener("change", function () {
    agencyFields.classList.toggle("nascosto", !usaAgenzia.checked);

    if (!usaAgenzia.checked) {
        document.getElementById("commissione-agenzia").value = 0;
        document.getElementById("commissione-uscita").value = 0;
        document.getElementById("costi-fissi").value = 0;
        document.getElementById("clausole").value = "";
    }
});

form.addEventListener("submit", async function (event) {
    event.preventDefault();
    nascondiErrore();

    const investmentType = metodoInvestimento();
    const taxRate = taxRateEffettiva();
    taxRateHidden.value = Number.isFinite(taxRate) ? taxRate : 0;

    const dati = {
        investment_type: investmentType,
        capitale_iniziale: valoreNumerico("capitale-iniziale"),
        investimento_mensile: investmentType === "pac"
            ? valoreNumerico("investimento")
            : 0,
        durata_anni: valoreNumerico("durata"),
        percentuale_rendimento_medio: valoreNumerico("rendimento"),
        tasse_stato: taxRate,
        tax_profile: taxProfileSelezionato(),
        inflazione_media_annuale: valoreNumerico("inflazione"),
        commissione_agenzia_finale: usaAgenzia.checked
            ? valoreNumerico("commissione-agenzia")
            : 0,
        commissione_uscita: usaAgenzia.checked
            ? valoreNumerico("commissione-uscita")
            : 0,
        costi_fissi_finali: usaAgenzia.checked
            ? valoreNumerico("costi-fissi")
            : 0,
        clausole: usaAgenzia.checked
            ? document.getElementById("clausole").value.trim()
            : ""
    };

    const erroreValidazione = validaDati(dati);
    if (erroreValidazione) {
        mostraErrore(erroreValidazione);
        return;
    }

    try {
        const risposta = await fetch("/calcola", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dati)
        });

        if (!risposta.ok) {
            throw new Error("HTTP error: " + risposta.status);
        }

        const risultati = await risposta.json();
        aggiornaRisultati(risultati);
        aggiornaSummary(risultati);

        resultSeries = risultati.serie_temporale || risultati.serie_annuale || [];
        creaLegenda(resultLegend, resultSeries);
        aggiornaTimelineControl("result", resultSeries);

        schermataForm.classList.add("nascosto");
        sezioneRisultati.classList.remove("nascosto");

        requestAnimationFrame(function () {
            disegnaGrafico(resultCanvas, resultSeries);
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    } catch (errore) {
        console.error("Calculation error:", errore);
        mostraErrore("The simulation could not be calculated. Check the Flask terminal for details.");
    }
});

bottoneNuovaSimulazione.addEventListener("click", function () {
    sezioneRisultati.classList.add("nascosto");
    summarySection.classList.add("nascosto");
    schermataForm.classList.remove("nascosto");

    requestAnimationFrame(function () {
        disegnaGrafico(previewCanvas, previewSeries);
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});

timelineControls.forEach(function (control) {
    control.querySelectorAll(".timeline-option").forEach(function (button) {
        button.addEventListener("click", function () {
            timeLabelMode = button.dataset.timeMode === "calendar"
                ? "calendar"
                : "relative";

            aggiornaTuttiTimelineControl();

            if (previewSeries.length > 0) {
                disegnaGrafico(previewCanvas, previewSeries);
            }

            if (resultSeries.length > 0) {
                disegnaGrafico(resultCanvas, resultSeries);
            }
        });
    });
});

setupInteractiveChart(previewCanvas, previewTooltip);
setupInteractiveChart(resultCanvas, resultTooltip);

window.addEventListener("resize", function () {
    if (!schermataForm.classList.contains("nascosto") && previewSeries.length > 0) {
        disegnaGrafico(previewCanvas, previewSeries);
    }

    if (!sezioneRisultati.classList.contains("nascosto") && resultSeries.length > 0) {
        disegnaGrafico(resultCanvas, resultSeries);
    }
});

aggiornaMetodoInvestimento();
aggiornaTaxPreset();
aggiornaTuttiTimelineControl();
caricaPreset();
