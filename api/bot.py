import base64
import io
import json
import sys
import zipfile
from xml.sax.saxutils import escape

sys.stdin.reconfigure(encoding="utf-8")


def xlsx(filas):
    celdas = ""
    for i, fila in enumerate(filas, 1):
        fila_xml = "".join(
            f'<c r="{chr(65 + j)}{i}" t="inlineStr"><is><t>{escape(str(v))}</t></is></c>'
            for j, v in enumerate(fila)
        )
        celdas += f'<row r="{i}">{fila_xml}</row>'
    partes = {
        "[Content_Types].xml": (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            "</Types>"
        ),
        "_rels/.rels": (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            "</Relationships>"
        ),
        "xl/workbook.xml": (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            '<sheets><sheet name="Bot" sheetId="1" r:id="rId1"/></sheets></workbook>'
        ),
        "xl/_rels/workbook.xml.rels": (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            "</Relationships>"
        ),
        "xl/worksheets/sheet1.xml": (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            f"<sheetData>{celdas}</sheetData></worksheet>"
        ),
    }
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as z:
        for nombre, contenido in partes.items():
            z.writestr(nombre, contenido)
    return buffer.getvalue()


entrada = json.loads(sys.stdin.read())
operacion = entrada.get("operacion")

if operacion == "version":
    salida = {"ok": True, "python": sys.version.split()[0]}
elif operacion == "generar":
    contenido = xlsx([["Generado por", "bot Python"], ["Titulo", entrada.get("titulo", "")]])
    salida = {"ok": True, "nombre": "bot.xlsx", "xlsx": base64.b64encode(contenido).decode("ascii")}
else:
    salida = {"ok": False, "error": "operacion desconocida"}

sys.stdout.write(json.dumps(salida))
