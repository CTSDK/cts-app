"""
Laver importfilen cts-import.json ud fra Excel-projektmappen.
Indeholder kun data + Excels egne resultater (facit) til kontrol i Sheets.
Filen indeholder forretningsdata og må ALDRIG lægges i repository'et (.gitignore udelukker den).

Brug:  python3 -I tools/eksport_excel.py "CTS Ny – 261103.xlsx" cts-import.json
"""
import sys, json, datetime, openpyxl

def tekst(v):
    return v.text if hasattr(v, 'text') else v

def dato(v):
    if isinstance(v, datetime.datetime): return v.strftime('%Y-%m-%d')
    if isinstance(v, datetime.date): return v.isoformat()
    return v

def celle(f, v):
    """Indtastet værdi; simple formler (fx =91.81*30/173) bevares som formel."""
    f = tekst(f)
    if isinstance(f, str) and f.startswith('='):
        return {'formel': f}
    return dato(v)

def tal(v):
    return round(float(v), 6) if isinstance(v, (int, float)) and not isinstance(v, bool) else v

def main(sti, ud):
    wf = openpyxl.load_workbook(sti)                    # formler
    wv = openpyxl.load_workbook(sti, data_only=True)     # Excels beregnede værdier (facit)
    res = {'version': 1, 'lavet': datetime.datetime.now().isoformat(timespec='seconds'), 'facit': {}}

    # ---------- Indkøbslog ----------
    L, Lv = wf['Indkøbslog'], wv['Indkøbslog']
    log, flog = [], []
    for r in range(3, Lv.max_row + 1):
        a = Lv.cell(r, 1).value
        if a is None or not isinstance(a, (int, float)): continue
        log.append([int(a), tal(Lv.cell(r, 2).value or 0), Lv.cell(r, 7).value or '', Lv.cell(r, 8).value or ''])
        flog.append([int(a), Lv.cell(r, 11).value, Lv.cell(r, 12).value, Lv.cell(r, 13).value])
    res['indkoebslog'] = log; res['facit']['indkoebslog'] = flog

    # ---------- Indkøb ----------
    I, Iv = wf['Indkøb'], wv['Indkøb']
    ind, find = [], []
    for r in range(3, 997):
        b = Iv.cell(r, 2).value
        if b is None: continue
        e_formel = isinstance(tekst(I.cell(r, 5).value), str) and str(tekst(I.cell(r, 5).value)).startswith('=')
        f_fast = I.cell(r, 6).value if isinstance(I.cell(r, 6).value, (int, float)) else ''
        setnr = Iv.cell(r, 3).value
        ind.append({
            'dato': int(b), 'setnr': '' if setnr is None else (setnr if isinstance(setnr, str) else int(setnr)),
            'vaerdi': tal(Iv.cell(r, 5).value) if Iv.cell(r, 5).value is not None else '',
            'salgFor': tal(Iv.cell(r, 7).value) if Iv.cell(r, 7).value is not None else '',
            'ovp': Iv.cell(r, 8).value or '', 'sorteret': Iv.cell(r, 9).value is True,
            'fotos': Iv.cell(r, 10).value is True, 'klar': Iv.cell(r, 11).value is True,
            'stand': Iv.cell(r, 12).value if Iv.cell(r, 12).value is not None else '',
            'platform': Iv.cell(r, 13).value or '', 'noter': Iv.cell(r, 17).value or '',
            'kilde': 'Egne salg' if e_formel else '', 'fast': f_fast
        })
        find.append([str(Iv.cell(r, 1).value), round(float(Iv.cell(r, 6).value or 0), 2), Iv.cell(r, 14).value or '', Iv.cell(r, 4).value or ''])
    res['indkoeb'] = ind; res['facit']['indkoeb'] = find

    # ---------- Salg ----------
    for aar, slut in (('2025', 201), ('2026', 162)):
        S, Sv = wf['Salg ' + aar], wv['Salg ' + aar]
        rk, fr = [], []
        sidste = max([r for r in range(4, slut + 1) if Sv.cell(r, 1).value is not None or Sv.cell(r, 2).value is not None] or [3])
        for r in range(4, sidste + 1):   # tomme rækker bevares, så formler som =91.81-F81-F82 peger rigtigt
            raekke = {}
            for kol, navn in ((1, 'A'), (2, 'B'), (3, 'C'), (4, 'D'), (6, 'F'), (7, 'G'), (8, 'H'), (9, 'I'), (10, 'J'), (15, 'O'), (16, 'P')):
                v = celle(S.cell(r, kol).value, Sv.cell(r, kol).value)
                if v not in (None, ''): raekke[navn] = tal(v) if not isinstance(v, dict) else v
            if aar == '2025' and Sv.cell(r, 14).value not in (None, ''): raekke['N'] = Sv.cell(r, 14).value
            rk.append(raekke)
            fr.append([r] + [tal(Sv.cell(r, k).value) if Sv.cell(r, k).value not in (None, '') else '' for k in (5, 11, 12, 13, 14)])
        res['salg' + aar] = {'kurs': Sv['R2'].value, 'raekker': rk}
        res['facit']['salg' + aar] = fr

    # ---------- Udgifter ----------
    for aar in ('2025', '2026'):
        U, Uv = wf['Udgifter ' + aar], wv['Udgifter ' + aar]
        rk, fr = [], []
        sidste = max([r for r in range(3, Uv.max_row + 1) if Uv.cell(r, 1).value is not None or Uv.cell(r, 2).value is not None] or [2])
        for r in range(3, sidste + 1):
            raekke = {}
            for kol, navn in ((1, 'A'), (2, 'B'), (3, 'C'), (5, 'E'), (6, 'F'), (7, 'G'), (9, 'I'), (10, 'J'), (12, 'L')):
                v = celle(U.cell(r, kol).value, Uv.cell(r, kol).value)
                if v not in (None, ''): raekke[navn] = (str(v) if navn == 'C' else (tal(v) if not isinstance(v, dict) else v))
            rk.append(raekke)
            fr.append([r, tal(Uv.cell(r, 8).value), tal(Uv.cell(r, 11).value)])
        res['udgifter' + aar] = rk
        res['facit']['udgifter' + aar] = fr

    # ---------- Skat (kun facit + tekster) ----------
    for aar in ('2025', '2026'):
        K, Kv = wf['Skat ' + aar], wv['Skat ' + aar]
        tekster = [[r, Kv.cell(r, 1).value or '', Kv.cell(r, 3).value or ''] for r in range(1, 20) if Kv.cell(r, 1).value or Kv.cell(r, 3).value]
        res['skat' + aar] = tekster
        res['facit']['skat' + aar] = {str(r): tal(Kv.cell(r, 2).value) for r in (4, 7, 8, 10, 11, 13, 14, 17, 18)}

    # ---------- Kontoplan og platformlister ----------
    C = wv['_Claude']
    res['kontoplan'] = [[str(C.cell(r, 6).value), C.cell(r, 7).value] for r in range(2, 19) if C.cell(r, 6).value]
    res['platformeIndkoeb'] = [C.cell(r, 4).value for r in range(2, 12) if C.cell(r, 4).value]
    res['platformeSalg'] = [C.cell(r, 8).value for r in range(2, 12) if C.cell(r, 8).value]

    # ---------- eBay-afstemning ----------
    E, Ev = wf['eBay-afstemning'], wv['eBay-afstemning']
    res['ebay'] = {'titel': Ev['A1'].value, 'raekker': [[Ev.cell(r, 1).value, Ev.cell(r, 2).value or ''] for r in range(3, 414) if Ev.cell(r, 1).value]}
    res['facit']['ebay'] = [[Ev.cell(r, 1).value, Ev.cell(r, 11).value] for r in range(3, 414) if Ev.cell(r, 1).value]

    # ---------- DB Salgspriser (facit) ----------
    D = wv['DB Salgspriser']
    res['facit']['dbSalgspriser'] = [[str(D.cell(r, 1).value), tal(D.cell(r, 3).value), D.cell(r, 4).value, tal(D.cell(r, 5).value), tal(D.cell(r, 6).value)]
                                     for r in range(3, D.max_row + 1) if D.cell(r, 1).value not in (None, '')]

    with open(ud, 'w', encoding='utf-8') as fh:
        json.dump(res, fh, ensure_ascii=False, default=str)
    # Kort opsummering
    print('Indkøbslog', len(log), 'Indkøb', len(ind), 'Salg 2025', len(res['salg2025']['raekker']), 'Salg 2026', len(res['salg2026']['raekker']),
          'Udgifter', len(res['udgifter2025']), len(res['udgifter2026']), 'eBay', len(res['ebay']['raekker']), 'DBS', len(res['facit']['dbSalgspriser']))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
