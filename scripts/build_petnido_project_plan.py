from __future__ import annotations

from pathlib import Path
from datetime import date
from typing import Iterable, Sequence

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "deliverables"
ASSET_DIR = ROOT / ".docx-assets"
OUTPUT = OUT_DIR / "Petnido网站项目计划书_v1.0.docx"

# standard_business_brief preset, with a named CJK readability override.
PAGE_WIDTH_DXA = 12240
PAGE_HEIGHT_DXA = 15840
CONTENT_WIDTH_DXA = 9360
TABLE_INDENT_DXA = 120
# Named Unicode compatibility override for this Chinese-first deliverable.
# Arial Unicode MS renders reliably in both Microsoft Word and LibreOffice,
# whereas macOS-only CJK TTC fonts may be substituted with tofu glyphs.
FONT_LATIN = "Arial Unicode MS"
FONT_CJK = "Arial Unicode MS"
NAVY = "2D2152"
PURPLE = "6B4AA0"
PURPLE_DARK = "50327C"
PURPLE_LIGHT = "EEE8F6"
INK = "24202B"
MUTED = "6E6876"
LINE = "D8D3DF"
SOFT = "F6F4F8"
GREEN = "2E6B57"
GREEN_LIGHT = "E6F3ED"
GOLD = "8A6420"
GOLD_LIGHT = "FAF1DC"
RED = "9B3347"
RED_LIGHT = "F9E9ED"
WHITE = "FFFFFF"


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_border(cell, color: str = LINE, size: str = "6") -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_borders = tc_pr.first_child_found_in("w:tcBorders")
    if tc_borders is None:
        tc_borders = OxmlElement("w:tcBorders")
        tc_pr.append(tc_borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = f"w:{edge}"
        border = tc_borders.find(qn(tag))
        if border is None:
            border = OxmlElement(tag)
            tc_borders.append(border)
        border.set(qn("w:val"), "single")
        border.set(qn("w:sz"), size)
        border.set(qn("w:color"), color)


def set_cell_margins(cell, top: int = 80, start: int = 120, bottom: int = 80, end: int = 120) -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for key, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{key}"))
        if node is None:
            node = OxmlElement(f"w:{key}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_geometry(table, widths_dxa: Sequence[int], indent_dxa: int = TABLE_INDENT_DXA) -> None:
    assert sum(widths_dxa) == CONTENT_WIDTH_DXA, (widths_dxa, sum(widths_dxa))
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(CONTENT_WIDTH_DXA))
    tbl_w.set(qn("w:type"), "dxa")
    tbl_ind = tbl_pr.find(qn("w:tblInd"))
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), str(indent_dxa))
    tbl_ind.set(qn("w:type"), "dxa")
    grid = tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths_dxa:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)
    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            width = widths_dxa[idx]
            cell.width = Inches(width / 1440)
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(width))
            tc_w.set(qn("w:type"), "dxa")
            set_cell_margins(cell)
            set_cell_border(cell)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER


def prevent_row_split(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    tr_pr.append(cant_split)


def repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_run_font(run, size: float | None = None, bold: bool | None = None,
                 color: str | None = None, italic: bool | None = None,
                 font: str = FONT_LATIN) -> None:
    run.font.name = font
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:ascii"), font)
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:hAnsi"), font)
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), FONT_CJK)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic
    if color is not None:
        run.font.color.rgb = RGBColor.from_string(color)


def set_para_spacing(paragraph, before: float = 0, after: float = 6,
                     line: float = 1.10, keep_with_next: bool | None = None) -> None:
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    fmt.line_spacing = line
    if keep_with_next is not None:
        fmt.keep_with_next = keep_with_next


def set_repeat_header_text(cell, text: str) -> None:
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_para_spacing(p, after=0, line=1.05)
    r = p.add_run(text)
    set_run_font(r, size=9.5, bold=True, color=WHITE)


def clear_paragraph(p) -> None:
    for child in list(p._element):
        p._element.remove(child)


def add_field(paragraph, instr: str) -> None:
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = instr
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = "1"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instruction, separate, text, end])


def add_custom_numbering(doc: Document) -> tuple[int, int]:
    numbering = doc.part.numbering_part.element

    def next_id(tag: str, attr: str) -> int:
        values = [int(node.get(qn(attr))) for node in numbering.findall(qn(tag)) if node.get(qn(attr))]
        return max(values, default=0) + 1

    def make_abstract(abstract_id: int, fmt: str, text: str) -> None:
        abstract = OxmlElement("w:abstractNum")
        abstract.set(qn("w:abstractNumId"), str(abstract_id))
        multi = OxmlElement("w:multiLevelType")
        multi.set(qn("w:val"), "singleLevel")
        abstract.append(multi)
        lvl = OxmlElement("w:lvl")
        lvl.set(qn("w:ilvl"), "0")
        start = OxmlElement("w:start")
        start.set(qn("w:val"), "1")
        num_fmt = OxmlElement("w:numFmt")
        num_fmt.set(qn("w:val"), fmt)
        lvl_text = OxmlElement("w:lvlText")
        lvl_text.set(qn("w:val"), text)
        suff = OxmlElement("w:suff")
        suff.set(qn("w:val"), "tab")
        p_pr = OxmlElement("w:pPr")
        tabs = OxmlElement("w:tabs")
        tab = OxmlElement("w:tab")
        tab.set(qn("w:val"), "num")
        tab.set(qn("w:pos"), "720")
        tabs.append(tab)
        ind = OxmlElement("w:ind")
        ind.set(qn("w:left"), "720")
        ind.set(qn("w:hanging"), "360")
        spacing = OxmlElement("w:spacing")
        spacing.set(qn("w:after"), "160")
        spacing.set(qn("w:line"), "280")
        spacing.set(qn("w:lineRule"), "auto")
        p_pr.extend([tabs, ind, spacing])
        lvl.extend([start, num_fmt, lvl_text, suff, p_pr])
        if fmt == "bullet":
            r_pr = OxmlElement("w:rPr")
            fonts = OxmlElement("w:rFonts")
            fonts.set(qn("w:ascii"), "Symbol")
            fonts.set(qn("w:hAnsi"), "Symbol")
            r_pr.append(fonts)
            lvl.append(r_pr)
        abstract.append(lvl)
        numbering.append(abstract)

    def make_num(abstract_id: int) -> int:
        num_id = next_id("w:num", "w:numId")
        num = OxmlElement("w:num")
        num.set(qn("w:numId"), str(num_id))
        abstract_ref = OxmlElement("w:abstractNumId")
        abstract_ref.set(qn("w:val"), str(abstract_id))
        num.append(abstract_ref)
        numbering.append(num)
        return num_id

    bullet_abs = next_id("w:abstractNum", "w:abstractNumId")
    make_abstract(bullet_abs, "bullet", "")
    decimal_abs = bullet_abs + 1
    make_abstract(decimal_abs, "decimal", "%1.")
    return make_num(bullet_abs), make_num(decimal_abs)


class PlanDoc:
    def __init__(self) -> None:
        self.doc = Document()
        self.bullet_num_id, self.decimal_num_id = add_custom_numbering(self.doc)
        self.h1_count = 0
        self._configure_document()

    def _configure_document(self) -> None:
        doc = self.doc
        section = doc.sections[0]
        section.page_width = Inches(8.5)
        section.page_height = Inches(11)
        section.top_margin = Inches(1)
        section.right_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.header_distance = Inches(0.492)
        section.footer_distance = Inches(0.492)
        section.different_first_page_header_footer = True

        styles = doc.styles
        normal = styles["Normal"]
        normal.font.name = FONT_LATIN
        normal._element.rPr.rFonts.set(qn("w:ascii"), FONT_LATIN)
        normal._element.rPr.rFonts.set(qn("w:hAnsi"), FONT_LATIN)
        normal._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_CJK)
        normal.font.size = Pt(11)
        normal.font.color.rgb = RGBColor.from_string(INK)
        normal.paragraph_format.space_before = Pt(0)
        normal.paragraph_format.space_after = Pt(6)
        normal.paragraph_format.line_spacing = 1.10

        for name, size, before, after, color in (
            ("Heading 1", 16, 16, 8, PURPLE_DARK),
            ("Heading 2", 13, 12, 6, PURPLE),
            ("Heading 3", 12, 8, 4, NAVY),
        ):
            style = styles[name]
            style.font.name = FONT_LATIN
            style._element.rPr.rFonts.set(qn("w:ascii"), FONT_LATIN)
            style._element.rPr.rFonts.set(qn("w:hAnsi"), FONT_LATIN)
            style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_CJK)
            style.font.size = Pt(size)
            style.font.bold = True
            style.font.color.rgb = RGBColor.from_string(color)
            style.paragraph_format.space_before = Pt(before)
            style.paragraph_format.space_after = Pt(after)
            style.paragraph_format.line_spacing = 1.05
            style.paragraph_format.keep_with_next = True
            style.paragraph_format.keep_together = True

        self._set_header_footer(section)
        doc.core_properties.title = "Petnido 网站项目计划书"
        doc.core_properties.subject = "宠物照护需求与服务撮合平台产品及实施计划"
        doc.core_properties.author = "Petnido 项目组"
        doc.core_properties.keywords = "Petnido, 宠物照护, 项目计划, PRD, 技术方案"

    def _set_header_footer(self, section) -> None:
        header = section.header
        p = header.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        set_para_spacing(p, after=0)
        r = p.add_run("PETNIDO  ·  网站项目计划书")
        set_run_font(r, size=8.5, bold=True, color=MUTED)

        footer = section.footer
        p = footer.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        set_para_spacing(p, after=0)
        r = p.add_run("内部工作稿  |  ")
        set_run_font(r, size=8.5, color=MUTED)
        add_field(p, "PAGE")
        for run in p.runs:
            set_run_font(run, size=8.5, color=MUTED)

        first_header = section.first_page_header
        clear_paragraph(first_header.paragraphs[0])
        first_footer = section.first_page_footer
        clear_paragraph(first_footer.paragraphs[0])
        fp = first_footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = fp.add_run("Petnido · 让合适的人与宠物照护需求更安心地相遇")
        set_run_font(r, size=8.5, color=MUTED, italic=True)

    def title_page(self) -> None:
        self.spacer(42)
        p = self.doc.add_paragraph()
        set_para_spacing(p, after=8)
        r = p.add_run("PETNIDO")
        set_run_font(r, size=12, bold=True, color=PURPLE)
        p = self.doc.add_paragraph()
        set_para_spacing(p, after=8, line=1.0)
        r = p.add_run("网站项目计划书")
        set_run_font(r, size=28, bold=True, color=NAVY)
        p = self.doc.add_paragraph()
        set_para_spacing(p, after=26, line=1.15)
        r = p.add_run("宠物照护需求与服务撮合平台 · 产品规划、技术实施与上线验收")
        set_run_font(r, size=13.5, color=MUTED)

        self.callout(
            "项目定位",
            "一个支持游客就近浏览、登录后发布需求或服务、通过站内沟通完成双方确认的多语言宠物照护平台。首版优先建立可信、可追踪的撮合闭环，而不是直接承诺平台担保交易。",
            fill=PURPLE_LIGHT,
            border=PURPLE,
        )
        self.spacer(18)
        rows = [
            ("文档版本", "v1.0"),
            ("编制日期", "2026 年 8 月 3 日"),
            ("建议周期", "16 周开发 + 2 周上线缓冲"),
            ("建议团队", "产品/设计 1–2、全栈 2–3、测试 1、兼职运维/内容 1"),
            ("目标端", "响应式 Web（桌面与移动浏览器）"),
        ]
        self.label_value_table(rows)
        self.doc.add_page_break()

    def spacer(self, points: float) -> None:
        p = self.doc.add_paragraph()
        set_para_spacing(p, after=points, line=1.0)

    def h1(self, text: str) -> None:
        if self.h1_count > 0:
            # Table/callout helpers add a small breathing-space paragraph.
            # If that spacer alone rolls onto a new page, a following
            # page-break-before heading would create an empty page. Trim it.
            body = self.doc._body._element
            while len(body) and body[-1].tag == qn("w:p"):
                p_text = "".join(body[-1].itertext()).strip()
                has_break = bool(body[-1].xpath('.//w:br[@w:type="page"]'))
                has_drawing = bool(body[-1].xpath('.//w:drawing'))
                if p_text or has_break or has_drawing:
                    break
                body.remove(body[-1])
        p = self.doc.add_paragraph(text, style="Heading 1")
        # A heading-owned page break avoids accidental blank pages when a
        # standalone break paragraph itself flows onto the next page.
        # Section 1 follows a nearly full-page summary table; allowing it to
        # flow naturally prevents LibreOffice from inserting an anchor-only
        # blank page after that table. Later major sections start on new pages.
        if self.h1_count > 1:
            p.paragraph_format.page_break_before = True
        self.h1_count += 1

    def h2(self, text: str) -> None:
        self.doc.add_paragraph(text, style="Heading 2")

    def h3(self, text: str) -> None:
        self.doc.add_paragraph(text, style="Heading 3")

    def p(self, text: str, bold_prefix: str | None = None, after: float = 6) -> None:
        p = self.doc.add_paragraph()
        set_para_spacing(p, after=after)
        if bold_prefix and text.startswith(bold_prefix):
            r = p.add_run(bold_prefix)
            set_run_font(r, size=11, bold=True, color=INK)
            r = p.add_run(text[len(bold_prefix):])
            set_run_font(r, size=11, color=INK)
        else:
            r = p.add_run(text)
            set_run_font(r, size=11, color=INK)

    def list_item(self, text: str, numbered: bool = False, bold_prefix: str | None = None) -> None:
        p = self.doc.add_paragraph()
        p_pr = p._p.get_or_add_pPr()
        num_pr = OxmlElement("w:numPr")
        ilvl = OxmlElement("w:ilvl")
        ilvl.set(qn("w:val"), "0")
        num_id = OxmlElement("w:numId")
        num_id.set(qn("w:val"), str(self.decimal_num_id if numbered else self.bullet_num_id))
        num_pr.extend([ilvl, num_id])
        p_pr.append(num_pr)
        set_para_spacing(p, after=8, line=1.167)
        if bold_prefix and text.startswith(bold_prefix):
            r = p.add_run(bold_prefix)
            set_run_font(r, size=11, bold=True, color=INK)
            r = p.add_run(text[len(bold_prefix):])
            set_run_font(r, size=11, color=INK)
        else:
            r = p.add_run(text)
            set_run_font(r, size=11, color=INK)

    def callout(self, label: str, text: str, fill: str = SOFT, border: str = LINE) -> None:
        table = self.doc.add_table(rows=1, cols=1)
        set_table_geometry(table, [CONTENT_WIDTH_DXA])
        cell = table.cell(0, 0)
        set_cell_shading(cell, fill)
        set_cell_border(cell, border, "8")
        p = cell.paragraphs[0]
        set_para_spacing(p, after=2, line=1.10)
        r = p.add_run(f"{label}  ")
        set_run_font(r, size=10.5, bold=True, color=border)
        r = p.add_run(text)
        set_run_font(r, size=10.5, color=INK)
        self.spacer(5)

    def label_value_table(self, rows: Sequence[tuple[str, str]]) -> None:
        table = self.doc.add_table(rows=0, cols=2)
        for label, value in rows:
            cells = table.add_row().cells
            cells[0].text = ""
            cells[1].text = ""
            p0 = cells[0].paragraphs[0]
            set_para_spacing(p0, after=0)
            r = p0.add_run(label)
            set_run_font(r, size=9.5, bold=True, color=PURPLE_DARK)
            set_cell_shading(cells[0], PURPLE_LIGHT)
            p1 = cells[1].paragraphs[0]
            set_para_spacing(p1, after=0)
            r = p1.add_run(value)
            set_run_font(r, size=10, color=INK)
            prevent_row_split(table.rows[-1])
        set_table_geometry(table, [2700, 6660])
        self.spacer(6)

    def matrix(self, headers: Sequence[str], rows: Sequence[Sequence[str]], widths: Sequence[int],
               header_fill: str = PURPLE_DARK, font_size: float = 9.2) -> None:
        table = self.doc.add_table(rows=1, cols=len(headers))
        for idx, header in enumerate(headers):
            set_repeat_header_text(table.rows[0].cells[idx], header)
            set_cell_shading(table.rows[0].cells[idx], header_fill)
        repeat_table_header(table.rows[0])
        prevent_row_split(table.rows[0])
        for ridx, row_values in enumerate(rows):
            cells = table.add_row().cells
            for idx, value in enumerate(row_values):
                p = cells[idx].paragraphs[0]
                set_para_spacing(p, after=0, line=1.08)
                r = p.add_run(value)
                set_run_font(r, size=font_size, color=INK)
                if ridx % 2 == 1:
                    set_cell_shading(cells[idx], "FBFAFC")
            prevent_row_split(table.rows[-1])
        set_table_geometry(table, widths)
        self.spacer(7)

    def page_break(self) -> None:
        # Top-level headings own pagination through h1(); retained as a
        # semantic marker in the authoring code.
        return

    def add_picture(self, path: Path, width_in: float = 6.25,
                    alt_text: str = "Petnido 项目示意图") -> None:
        p = self.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_para_spacing(p, after=5)
        inline = p.add_run().add_picture(str(path), width=Inches(width_in))
        inline._inline.docPr.set("descr", alt_text)
        inline._inline.docPr.set("title", alt_text)


def rounded_rect(draw: ImageDraw.ImageDraw, box, fill, outline, radius=20, width=3):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def load_font(size: int, bold: bool = False):
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size=size, index=1 if bold else 0)
            except Exception:
                try:
                    return ImageFont.truetype(path, size=size)
                except Exception:
                    pass
    return ImageFont.load_default()


def make_loop_diagram(path: Path) -> None:
    img = Image.new("RGB", (1800, 700), "#FFFFFF")
    draw = ImageDraw.Draw(img)
    title_font = load_font(42, True)
    body_font = load_font(28, False)
    small_font = load_font(24, False)
    draw.text((70, 42), "Petnido 核心撮合闭环", font=title_font, fill="#2D2152")
    labels = [
        ("公开浏览", "需求 / 服务者 / 服务"),
        ("登录发起", "咨询 / 应聘 / 预约"),
        ("站内沟通", "补充时间、任务、费用"),
        ("双方确认", "待确认 → 已确认"),
        ("履约结束", "完成 / 取消 / 评价"),
    ]
    x_positions = [60, 410, 760, 1110, 1460]
    for idx, ((title, subtitle), x) in enumerate(zip(labels, x_positions)):
        fill = "#EEE8F6" if idx not in (3, 4) else ("#E6F3ED" if idx == 3 else "#FAF1DC")
        outline = "#6B4AA0" if idx not in (3, 4) else ("#2E6B57" if idx == 3 else "#8A6420")
        rounded_rect(draw, (x, 220, x + 280, 420), fill, outline, radius=24, width=4)
        bbox = draw.textbbox((0, 0), title, font=body_font)
        draw.text((x + 140 - (bbox[2] - bbox[0]) / 2, 262), title, font=body_font, fill="#24202B")
        bbox = draw.multiline_textbbox((0, 0), subtitle, font=small_font, spacing=5, align="center")
        draw.multiline_text((x + 140 - (bbox[2] - bbox[0]) / 2, 325), subtitle, font=small_font, fill="#6E6876", spacing=5, align="center")
        if idx < len(labels) - 1:
            draw.line((x + 288, 320, x_positions[idx + 1] - 18, 320), fill="#7A7281", width=6)
            draw.polygon([(x_positions[idx + 1] - 18, 310), (x_positions[idx + 1], 320), (x_positions[idx + 1] - 18, 330)], fill="#7A7281")
    draw.text((68, 520), "关键规则：按钮点击只创建意向和会话；必须由接收方明确确认，才进入匹配/预约成功状态。",
              font=small_font, fill="#50327C")
    draw.text((68, 574), "任一方取消后保留审计记录；需求仅在 OPEN 且未过期时公开展示。",
              font=small_font, fill="#50327C")
    img.save(path, quality=95)


def make_architecture_diagram(path: Path) -> None:
    img = Image.new("RGB", (1800, 900), "#FFFFFF")
    draw = ImageDraw.Draw(img)
    title_font = load_font(42, True)
    head_font = load_font(28, True)
    body_font = load_font(23, False)
    draw.text((70, 40), "推荐逻辑架构（延续现有技术栈）", font=title_font, fill="#2D2152")
    layers = [
        (120, 170, 1680, 300, "体验层", "Next.js 14 · React · 响应式页面 · zh/ja/en · SEO 公开页", "#EEE8F6", "#6B4AA0"),
        (120, 350, 1680, 480, "业务/API 层", "tRPC · Zod 校验 · 权限策略 · 状态机 · 定时任务", "#F6F4F8", "#7A7281"),
        (120, 530, 1680, 660, "数据与通信层", "PostgreSQL + Prisma · 会话/消息 · 站内通知 · 邮件队列", "#E6F3ED", "#2E6B57"),
        (120, 710, 1680, 840, "外部能力", "OAuth/邮箱 · Cloudinary 对象存储 · 地图/地理编码 · 监控与备份", "#FAF1DC", "#8A6420"),
    ]
    for x1, y1, x2, y2, label, desc, fill, outline in layers:
        rounded_rect(draw, (x1, y1, x2, y2), fill, outline, radius=22, width=4)
        draw.text((175, y1 + 28), label, font=head_font, fill="#24202B")
        draw.text((470, y1 + 32), desc, font=body_font, fill="#4F4857")
    img.save(path, quality=95)


def build_document() -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    loop_path = ASSET_DIR / "matching-loop.png"
    arch_path = ASSET_DIR / "architecture.png"
    make_loop_diagram(loop_path)
    make_architecture_diagram(arch_path)

    d = PlanDoc()
    d.title_page()

    d.h1("0. 执行摘要")
    d.callout(
        "结论",
        "Petnido 应以“双向发布、先沟通后确认、状态可追踪”为核心差异点。当前代码已具备首页、三语言基础、需求与服务资料页面、认证和部分数据模型；真正决定能否上线的缺口集中在消息会话、应聘/预约状态机、收藏、通知、精细化排期字段、安全与后台治理。",
        fill=GREEN_LIGHT,
        border=GREEN,
    )
    d.p("本计划按一个 4–6 人的小型产品团队编制，建议用 16 周完成可公开运营的 V1，并预留 2 周处理审核、内容、数据迁移与上线问题。若只有 1–2 名开发者，应按优先级分两次上线，预计 24–30 周。")
    d.h2("项目成功的五个条件")
    for text in [
        "游客无需登录即可浏览附近需求、服务者与服务详情，但看不到精确门牌地址和敏感宠物信息。",
        "应聘或预约只产生“待对方确认”的意向和会话；对方明确接受后才算成功，所有反悔与取消都有状态记录。",
        "三类需求与三类服务都能表达真实照护场景，不把复杂任务硬塞进一个备注字段。",
        "公开搜索只返回可用内容：需求必须 OPEN 且未过期，服务必须启用、服务者总接单开关开启。",
        "中文、日文、英文覆盖核心业务流程；邮件提醒可退订，站内消息始终是权威记录。",
    ]:
        d.list_item(text)

    d.h2("建议优先级")
    d.matrix(
        ["级别", "范围", "上线判定"],
        [
            ["P0 / 必须", "认证、资料、需求/服务发布、筛选详情、消息、应聘、预约、确认/取消、过期规则、收藏、三语言核心流程", "缺一不可"],
            ["P1 / 首版增强", "邮件提醒、日历冲突提示、评价举报、基础后台、知识页、SEO 与分析", "可在灰度期补齐"],
            ["P2 / 后续", "平台支付/托管、保险、身份认证、智能推荐、移动 App、视频与实时定位", "不阻塞 V1"],
        ],
        [1500, 5460, 2400],
    )
    d.page_break()

    d.h1("1. 项目背景、目标与边界")
    d.h2("1.1 产品愿景")
    d.p("让宠物主人可以清楚表达照护需求，让有经验的个人或家庭按时间、距离、宠物条件和能力找到合适机会，并通过可追踪的沟通与确认降低信息不对称。")
    d.h2("1.2 业务目标")
    for text in [
        "形成需求侧与供给侧并存的双边市场，而不是单纯的服务目录。",
        "把“咨询—协商—确认”结构化，降低仅靠私聊造成的误解和失联。",
        "支持多宠物、重复上门、寄养环境、物资、接送与交通费用等真实场景。",
        "以附近发现和多语言为增长入口，先服务日本及跨语言用户，再逐步扩展地区。",
    ]:
        d.list_item(text)
    d.h2("1.3 V1 范围内")
    d.matrix(
        ["领域", "V1 交付"],
        [
            ["发现", "附近需求、附近服务者、服务列表/详情、组合筛选、收藏、公开 SEO 页面"],
            ["供需发布", "上门、寄养、自定义三种需求；同样三种服务；草稿、预览、编辑、关闭、删除"],
            ["交易前闭环", "咨询、应聘、预约、对方确认/拒绝、双方取消、恢复公开、历史记录"],
            ["沟通", "一对一会话、业务卡片、未读状态、系统消息、邮件提醒、基础附件"],
            ["信任与运营", "资料、宠物档案、服务环境照片、评价、举报、屏蔽、内容审核与后台"],
            ["内容与国际化", "三类照护介绍页、知识链接库、中文/日文/英文核心界面"],
        ],
        [2000, 7360],
    )
    d.h2("1.4 V1 明确不包含")
    for text in [
        "平台内收款、分账、退款仲裁或押金托管；V1 只记录预算与最终商议金额。",
        "平台保险承保、医疗建议或专业资质背书；展示资料不等于平台担保。",
        "原生 iOS/Android App、视频通话、实时 GPS 追踪、自动路线优化。",
        "复杂推荐算法；首版采用地理距离、可用性、宠物匹配与新鲜度排序。",
    ]:
        d.list_item(text)
    d.callout("范围控制", "若决定首发即接入支付，需新增 KYC、退款、争议、账务对账、税务和支付风控项目，建议单独增加 6–10 周并重新评估合规。", fill=GOLD_LIGHT, border=GOLD)
    d.page_break()

    d.h1("2. 用户角色、权限与产品原则")
    d.h2("2.1 角色定义")
    d.matrix(
        ["角色", "无需登录", "登录后", "主要限制"],
        [
            ["游客", "浏览公开需求、服务者、服务、介绍页、知识页", "—", "不可收藏、咨询、应聘、预约或发布"],
            ["普通用户/宠物主人", "同游客", "维护资料与宠物、发布需求、咨询/预约、收藏", "不能操作他人内容"],
            ["服务者模式用户", "同游客", "维护服务资料、发布多个服务、应聘需求、确认预约", "首次开启需显式确认；可随时暂停全部服务"],
            ["管理员/客服", "—", "用户、内容、举报、知识链接、邮件模板、审计查询", "高风险操作需留审计日志"],
        ],
        [1500, 2500, 3260, 2100],
        font_size=8.7,
    )
    d.h2("2.2 权限原则")
    for text in [
        "一个账号可同时是宠物主人和服务者，不创建割裂的两套账号。",
        "公开页只显示大致区域和距离，不公开门牌、精确坐标、联系方式和宠物医疗细节。",
        "所有写操作在服务端校验登录身份、资源归属与当前状态，不能只靠前端隐藏按钮。",
        "删除默认采用软删除或归档；已产生会话、申请或预约的记录不得物理删除。",
        "确认、取消、重新公开、批量修改等关键动作均写入状态历史与操作者。",
    ]:
        d.list_item(text)
    d.h2("2.3 核心产品原则")
    d.label_value_table([
        ("先沟通再成交", "点击应聘/预约只发出意向；接收方确认后才成功。"),
        ("信息适量公开", "帮助判断是否匹配，但不牺牲住址、行程和宠物安全。"),
        ("结构化优先", "时间、任务、对象、费用与交通拆为字段；备注只补充例外。"),
        ("可逆但可追踪", "允许反悔和恢复公开，同时保留取消时间、原因与历史。"),
        ("移动端优先", "发布流程可保存草稿、分步完成，重要动作始终有明确反馈。"),
    ])
    d.add_picture(loop_path, alt_text="Petnido 从公开浏览到履约结束的五步核心撮合闭环")
    d.page_break()

    d.h1("3. 信息架构与关键用户旅程")
    d.h2("3.1 建议站点地图")
    d.matrix(
        ["一级入口", "主要页面"],
        [
            ["首页", "附近需求、推荐服务者、三类照护入口、信任说明、登录/注册"],
            ["找需求", "列表/地图、筛选、详情、收藏、咨询、应聘"],
            ["找服务", "服务者列表、服务列表/详情、日历概览、咨询、预约"],
            ["发布", "发布需求向导、开通接单模式、发布服务向导、预览"],
            ["消息", "会话列表、聊天窗口、业务卡片、系统状态消息、附件"],
            ["个人中心", "我的需求、我的服务、匹配与预约、收藏、通知、资料、宠物、设置"],
            ["内容", "照护类型介绍、宠物照护知识库、按宠物/事项分类的外链"],
            ["管理后台", "用户、需求、服务、举报、知识链接、通知模板、审计日志"],
        ],
        [2100, 7260],
    )
    d.h2("3.2 游客到应聘成功")
    for text in [
        "游客允许定位或手动选择地区，浏览尚未过期且处于 OPEN 的需求。",
        "查看详情时只见模糊位置；点击咨询/应聘后弹出登录或注册，成功后回到原详情。",
        "填写自我介绍、可服务时间和可选报价；系统创建会话、申请与一条业务系统消息。",
        "发布者在会话中了解经验；接受后该申请变为 ACCEPTED，其他待处理申请被关闭，需求变为 MATCHED。",
        "发布者如取消已选服务者，预约/匹配变为 CANCELLED；若未过期，可选择恢复为 OPEN。",
    ]:
        d.list_item(text, numbered=True)
    d.h2("3.3 游客到预约成功")
    for text in [
        "游客浏览服务者或某项服务，查看可服务条件、价格规则和日期已有确认预约数量。",
        "点击预约，登录后选择开始/结束时间、宠物、数量、需求摘要和期望价格。",
        "系统校验服务启用、服务者总开关、时间范围和容量，创建 PENDING 预约及会话。",
        "服务者确认后变为 CONFIRMED；拒绝或任一方撤回则为 CANCELLED，并保留原因。",
        "同日容量达到上限时继续展示但标记“已满”并禁止提交；存在部分容量则提示剩余名额。",
    ]:
        d.list_item(text, numbered=True)
    d.h2("3.4 发布需求与服务")
    d.p("两种发布均采用“选择模式 → 分步填写 → 自动保存草稿 → 预览 → 发布”的向导。用户可以从已保存宠物档案导入宠物，也可以仅为本次临时添加。发布前展示敏感信息提示、费用摘要、公开可见范围和撤销方式。")
    d.page_break()

    d.h1("4. 功能需求：账号、资料与发现")
    d.h2("4.1 注册、登录与账号")
    for text in [
        "邮箱注册需验证码并设置密码；支持 Google 与 LINE 登录，第三方账号可在验证邮箱后合并。",
        "关键动作登录拦截后保留 callback URL、原筛选条件和用户草稿。",
        "支持忘记密码、修改邮箱、退出全部设备、注销账号与导出个人数据。",
        "邮箱可选绑定；绑定且验证后才可开启邮件消息提醒，伪邮箱不得接收通知。",
        "账号状态包含 ACTIVE、SUSPENDED、DEACTIVATED；管理员封禁不删除业务历史。",
    ]:
        d.list_item(text)
    d.h2("4.2 个人资料与宠物档案")
    d.matrix(
        ["对象", "字段与规则"],
        [
            ["个人资料", "头像、昵称、简介、语言、时区、公开地区、精确位置（私密）、邮箱通知偏好"],
            ["宠物档案", "名称、类型、品种、出生年月/年龄、性别、体型、照片、性格、饮食、健康与紧急说明、公开范围"],
            ["地址簿", "可保存多个地址；公开时只显示城市/区或距离；仅匹配成功且有需要时共享详细地址"],
            ["服务者资料", "接单总开关、经验介绍、经验月数、常用地区、常用货币、证明照片、响应状态"],
        ],
        [1900, 7460],
    )
    d.h2("4.3 公开浏览与筛选")
    d.matrix(
        ["内容", "筛选", "默认排序"],
        [
            ["需求", "地点/半径、预算区间、货币、宠物类型、任务类别、开始/结束时间、三种模式", "相关性：距离 + 新鲜度 + 时间匹配"],
            ["服务", "地点/半径、价格、货币、宠物类型、体型、年龄段、服务类型、可用日期、容量", "距离 + 可用性 + 资料完整度"],
            ["服务者", "地点、经验、宠物类型、服务类型、可用日期、是否有证明", "距离 + 活跃服务 + 响应表现"],
        ],
        [1500, 5560, 2300],
    )
    d.p("距离筛选使用保存的坐标计算，但前端只显示近似距离；地图标记应做模糊化。用户拒绝定位时，以手动选择地区或 IP 粗略定位作为替代。筛选条件写入 URL，便于返回、分享和 SEO。")
    d.h2("4.4 详情、收藏与过期")
    for text in [
        "需求详情显示模式、宠物摘要、时间、任务、近似地点、费用、交通规则、发布者公开资料与状态。",
        "服务详情显示服务者资料、适用宠物、可用时间、环境/经验证明、服务内容、价格、优惠、容量与预约热度。",
        "收藏要求登录。收藏夹保留过期或关闭内容，并清晰显示“已过期/已关闭/已匹配”，禁止再次应聘。",
        "搜索查询在服务端强制排除 endAt < now、status != OPEN 或 deletedAt 不为空的需求，不依赖夜间任务才隐藏。",
        "定时任务将过期的 OPEN 需求标记 EXPIRED，用于通知、统计和后台；展示查询与定时任务构成双保险。",
    ]:
        d.list_item(text)
    d.page_break()

    d.h1("5. 功能需求：三类需求发布")
    d.callout("统一要求", "所有模式都需：标题、宠物、日期/时间、地点、预算与货币、照片/备注、草稿、预览、发布、编辑、关闭、复制发布。发生有效申请后，对影响已申请者的重大修改要记录版本并发送通知。", fill=PURPLE_LIGHT, border=PURPLE)
    d.h2("5.1 上门需求（VISIT）")
    d.matrix(
        ["分组", "必填/可选字段与规则"],
        [
            ["宠物", "选择一个或多个已保存宠物，或临时创建；每只宠物可有独立任务和注意事项"],
            ["日期与频率", "开始/结束日期；每天、每 N 天、自定义日期；到访日每天次数；可排除日期"],
            ["每次到访", "第 1/2/3…次希望时间或时间窗；预计时长；本次涉及哪些宠物；逐宠物任务清单"],
            ["任务", "喂食、换水、清理、散步、用药、陪伴、观察、拍照反馈、自定义；支持数量/时长/说明"],
            ["地点", "精确地址私密保存；公开城市/区与近似距离；门禁与钥匙说明仅确认后共享"],
            ["费用", "总预算或每次预算；货币；是否支付交通费；交通费固定/按实际/上限/协商"],
        ],
        [2100, 7260],
    )
    d.h2("5.2 寄养需求（FOSTER）")
    d.matrix(
        ["分组", "必填/可选字段与规则"],
        [
            ["宠物与时间", "寄养宠物、入住/离开日期与时间、可否提前/延后、是否允许与其他宠物同住"],
            ["携带与准备", "主人自带物资清单；寄养家庭需准备的物资、数量、品牌/替代要求和费用承担方式"],
            ["日常照护", "每只宠物每日任务、次数、时间窗；定期任务；条件触发的不定期任务"],
            ["环境条件", "所需空间、笼舍/自由活动、空调、禁烟、儿童、其他宠物、全天有人等；不可接受情况"],
            ["接送", "主人自送自接、服务者接/送、出租车或协商；出发地；可接受服务者距离；交接联系人"],
            ["费用", "寄养总预算/每宠每天预算；家庭准备物资的计费；接送固定费/里程费/实报实销/上限"],
        ],
        [2100, 7260],
    )
    d.h2("5.3 自定义需求（OTHER）")
    d.p("适用于陪同就医、临时接送、洗护协助、拍摄、搬运笼具等非标准场景。字段包括宠物、日期/时间或时间窗、地点、任务说明、交付结果、预算/计价方式、交通与材料费、照片和安全注意事项。若任务涉及医疗操作、高风险运输或违法内容，发布时应提示并可进入人工审核。")
    d.h2("5.4 需求生命周期")
    d.matrix(
        ["状态", "是否公开", "允许动作", "进入条件"],
        [
            ["DRAFT", "否", "编辑、预览、删除", "保存未发布"],
            ["OPEN", "是（未过期）", "编辑、关闭、查看申请、选择服务者", "发布或取消匹配后恢复"],
            ["MATCHED", "否", "聊天、取消服务者、完成", "接受一名申请者"],
            ["COMPLETED", "否", "评价、复制", "履约完成"],
            ["CLOSED/CANCELLED", "否", "复制、符合条件时重开", "发布者主动关闭/取消"],
            ["EXPIRED", "否", "复制、查看历史", "结束时间已过且未完成"],
        ],
        [1500, 1700, 3400, 2760],
        font_size=8.7,
    )
    d.page_break()

    d.h1("6. 功能需求：服务者资料与三类服务")
    d.h2("6.1 开通接单模式")
    d.p("用户首次选择“我想提供服务”时，弹窗确认“开启接单模式吗？”并说明资料将公开、需要及时回复、可随时暂停。确认后创建服务者资料，但在至少完成简介、地区、货币并发布一项服务前，不进入公开服务者列表。")
    d.h2("6.2 服务者资料级批量管理")
    for text in [
        "暂停/开启全部服务：只改变总接单开关，不覆盖每个服务原来的独立启用状态。",
        "修改所有服务地点：先显示受影响服务列表和新旧地点，确认后批量更新并写入审计记录。",
        "修改所有服务货币：必须明确是否只改币种显示，还是按汇率换算金额；V1 建议不自动换算，仅要求逐项确认金额。",
        "单个服务仍可独立编辑、暂停、重新开启、复制或删除；已有预约的服务只能归档，不能物理删除。",
    ]:
        d.list_item(text)
    d.h2("6.3 上门服务")
    d.matrix(
        ["分组", "服务字段"],
        [
            ["范围", "基准位置、最小/最大服务半径、是否按距离加价、不可服务区域"],
            ["可用时间", "长期/日期范围；平日/周末/节假日；每日时间窗；指定可用日期与排除日期"],
            ["适用宠物", "类型、体型、年龄段、数量上限、特殊照护接受范围"],
            ["能力证明", "经验说明、经验时长、证明照片、证书信息（不做平台认证时必须标注“用户上传”）"],
            ["服务内容", "任务清单、每次时长、反馈方式、可选附加项"],
            ["价格优惠", "每次/小时/天计价；基础价、额外宠物价、远距离费、连续预约/长期优惠、节假日加价"],
        ],
        [2000, 7360],
    )
    d.h2("6.4 寄养服务")
    d.matrix(
        ["分组", "服务字段"],
        [
            ["宠物与容量", "可接宠物类型、体型、年龄、每次/每日最大数量、是否接受同住多户宠物"],
            ["时间", "可预约范围、入住/离开时间窗、节假日与排除日期、最短/最长寄养天数"],
            ["环境", "寄养地址（公开模糊）、室内外环境照片、面积与活动区、家中成员/儿童/吸烟情况、现有宠物"],
            ["物资与条件", "可提供的粮食、垫材、笼具、猫砂、玩具等；额外收费；主人必须携带物品；不可接受情况"],
            ["接送与价格", "是否接送、范围和费用；每宠每天价格、额外宠物、长期/多宠优惠、节假日价格"],
        ],
        [2000, 7360],
    )
    d.h2("6.5 自定义服务")
    d.p("字段包括服务名称、时间/可用规则、服务地点或移动范围、服务内容与交付、适用宠物类型/体型/年龄、经验说明与照片、价格单位、附加费用和优惠。自定义服务仍需选择标准化任务标签，以支持搜索。")
    d.h2("6.6 服务公开与容量")
    d.p("服务发布后默认公开。公开条件为服务 isActive、服务者总开关开启、未归档且资料达到最低完整度。详情页按日期显示已确认预约数量；寄养应显示“已确认 x / 容量 y”，上门与自定义服务显示忙碌程度而非暴露其他客户信息。")
    d.page_break()

    d.h1("7. 功能需求：咨询、应聘、预约与聊天")
    d.h2("7.1 统一会话模型")
    d.p("咨询、应聘与预约都应落入 Conversation，而不是仅保存收发双方。会话包含参与者、关联业务对象、最后消息、未读计数和状态；消息包含文本/图片/系统事件、发送者、发送时间、已读时间和撤回状态。一个需求或预约可有多个独立会话，避免不同候选人信息串线。")
    d.h2("7.2 发起咨询")
    for text in [
        "登录后可从需求、服务或服务者资料发起；系统自动附带对应业务卡片。",
        "若双方已有同一业务对象的有效会话，复用原会话，避免重复线程。",
        "咨询不改变需求或服务状态，也不占用服务容量。",
    ]:
        d.list_item(text)
    d.h2("7.3 应聘需求")
    for text in [
        "提交时填写介绍、可服务时间、报价/费用说明，并提示信息会发送给发布者。",
        "应聘者有服务资料时，消息卡片突出“查看服务资料”；没有时显示“该用户暂未建立服务资料，请通过聊天仔细了解经验”。",
        "申请初始 PENDING；发布者可 ACCEPT、REJECT；应聘者可 WITHDRAW。接受一人必须在同一事务中锁定需求并处理其他申请。",
        "发布者取消已选服务者后，可选择恢复需求为 OPEN；若已过期则只能复制重发。",
    ]:
        d.list_item(text)
    d.h2("7.4 预约服务")
    for text in [
        "预约必须包含时间段、宠物、数量、任务摘要和价格预期；初始状态 PENDING，不默认成功。",
        "服务者确认前再次校验服务开关、日期可用性、容量和冲突；确认后占用容量。",
        "服务者可拒绝并选择原因；请求者可撤回；确认后任一方仍可取消，但需记录操作者、原因和时间。",
        "取消确认后释放容量，服务详情的日历计数及时更新。",
    ]:
        d.list_item(text)
    d.h2("7.5 状态定义")
    d.matrix(
        ["对象", "建议状态流"],
        [
            ["Application", "PENDING → ACCEPTED / REJECTED / WITHDRAWN；ACCEPTED → CANCELLED / COMPLETED"],
            ["Booking", "PENDING → CONFIRMED / REJECTED / WITHDRAWN；CONFIRMED → CANCELLED / COMPLETED"],
            ["Conversation", "ACTIVE → ARCHIVED；被屏蔽时双方仍可查看历史但不能继续发送"],
            ["Message", "SENT → DELIVERED → READ；支持 SYSTEM 类型；V1 不要求端到端加密"],
        ],
        [2000, 7360],
    )
    d.h2("7.6 消息与邮件通知")
    d.p("站内消息是权威记录，建议 V1 用 5–15 秒轮询或短轮询实现近实时，避免一开始引入复杂 WebSocket；规模增长后再升级。邮箱验证且开启通知的用户，在离线/未读超过设定时间时收到摘要邮件，包含发件人昵称、关联业务、短摘要和安全回站链接，不在邮件里泄露地址或完整消息。")
    d.page_break()

    d.h1("8. 内容、国际化、信任与运营后台")
    d.h2("8.1 三类照护介绍页")
    d.p("建立总览页与上门、寄养、自定义三个详情页。每页说明适用场景、发布者需准备的信息、服务者需确认的信息、费用构成、安全提醒和常见问题，并在页尾引导“浏览对应需求/服务”或“立即发布”。")
    d.h2("8.2 宠物照护知识库")
    d.matrix(
        ["维度", "建议分类"],
        [
            ["宠物类型", "犬、猫、兔、鸟、龙猫、豚鼠、仓鼠、其他"],
            ["照护事项", "饮食饮水、清洁、散步运动、环境温度、用药、行为压力、寄养适应、运输、紧急处理"],
            ["内容字段", "标题、摘要、外链 URL、来源、语言、宠物标签、事项标签、发布日期、审核状态、失效检查时间"],
            ["运营规则", "仅收录可信来源；标注外部链接；定期检查死链；医疗内容附“非医疗建议”提示"],
        ],
        [2100, 7260],
    )
    d.h2("8.3 三语言")
    for text in [
        "V1 支持简体中文、日文、英文；语言优先级为用户设置 > URL/本地存储 > 浏览器语言。",
        "核心发布和交易状态不得混用硬编码文案；枚举值保存稳定代码，展示时翻译。",
        "用户生成内容不自动翻译；明确标注原文语言，后续可增加机器翻译按钮。",
        "日期、时区、数字与货币按 locale 格式化；金额不因切换语言自动换算。",
        "SEO 公开页使用语言路径与 hreflang，三种语言分别维护标题和描述。",
    ]:
        d.list_item(text)
    d.h2("8.4 信任与安全")
    for text in [
        "举报用户、需求、服务或消息；原因包括欺诈、骚扰、危险照护、违法、垃圾内容和隐私泄露。",
        "屏蔽后停止新消息和新申请，但保留历史与已确认预约的安全提示。",
        "评价只允许已完成的匹配/预约双方各写一次；取消订单不能直接评分，可提交私密反馈或举报。",
        "证明照片和证书默认仅为用户上传资料，除非平台完成审核后才显示“已验证”。",
        "后台提供内容下架、用户暂停、邮件重发、业务状态查看和审计日志；管理员不可无痕修改聊天内容。",
    ]:
        d.list_item(text)
    d.page_break()

    d.h1("9. 数据模型与关键业务规则")
    d.h2("9.1 建议核心实体")
    d.matrix(
        ["领域", "实体"],
        [
            ["账号", "User、Profile、Address、Pet、NotificationPreference、UserLocale"],
            ["供需", "Need、NeedPet、VisitSchedule、CareTask、MaterialItem、TransportRule、Service、ServiceAvailability、PriceRule"],
            ["撮合", "Application、Booking、StatusHistory、Conversation、ConversationParticipant、Message、MessageReceipt"],
            ["互动", "Favorite、Notification、Review、Report、Block"],
            ["运营", "CareArticleLink、Category、AuditLog、EmailDelivery、ModerationAction"],
        ],
        [1800, 7560],
    )
    d.h2("9.2 必须补强的数据库约束")
    for text in [
        "同一用户对同一 OPEN 需求只能存在一个有效 PENDING/ACCEPTED 申请。",
        "一个需求最多一个有效 ACCEPTED/CONFIRMED 匹配；接受操作使用数据库事务与行锁/唯一约束防并发双选。",
        "Booking 必须关联 needId 或 serviceId 其中之一且仅一个；当前模型需增加 serviceId。",
        "收藏使用 userId + targetType + targetId 唯一键；即使内容过期也不删除收藏记录。",
        "消息必须关联 conversationId；接收人从会话成员推导，避免单纯 from/to 导致多业务串线。",
        "时间统一保存 UTC，另存业务时区；结束时间必须晚于开始时间，重复日程展开需有上限。",
        "金额优先用最小货币单位整数或 Decimal，避免 Float；同时保存 currency 和 priceUnit。",
        "坐标用于查询，公开位置使用单独模糊坐标/区域字段，不能直接返回精确经纬度。",
    ]:
        d.list_item(text)
    d.h2("9.3 公开可见性规则")
    d.callout(
        "需求可见条件",
        "deletedAt IS NULL AND status = OPEN AND endAt >= now() AND owner.status = ACTIVE。即使 EXPIRED 定时任务延迟，查询也必须排除过期记录。",
        fill=GREEN_LIGHT,
        border=GREEN,
    )
    d.callout(
        "服务可见条件",
        "deletedAt IS NULL AND service.isActive = true AND serviceProfile.accepting = true AND user.status = ACTIVE，并在请求日期仍有可用规则。",
        fill=GREEN_LIGHT,
        border=GREEN,
    )
    d.h2("9.4 状态历史与幂等")
    d.p("Application、Booking、Need、Service 的关键状态改变都写 StatusHistory，包括旧状态、新状态、操作者、原因、请求 ID 与时间。接受、取消和邮件发送接口使用幂等键，避免用户双击或网络重试产生重复预约、重复消息和重复通知。")
    d.page_break()

    d.h1("10. 技术方案与现有代码差距")
    d.h2("10.1 建议延续的技术栈")
    d.add_picture(arch_path, alt_text="Petnido 推荐逻辑架构：体验层、业务 API 层、数据通信层与外部能力")
    d.matrix(
        ["层次", "现有/推荐选择", "说明"],
        [
            ["前端", "Next.js 14、React 18、TypeScript、Tailwind", "延续现有 App Router；公开页服务端渲染，交互页客户端增强"],
            ["API", "tRPC 10、Zod、TanStack Query", "统一鉴权、输入校验、错误码与缓存失效"],
            ["数据", "PostgreSQL、Prisma 5", "新增撮合、会话、收藏、通知、审核实体与索引"],
            ["身份", "NextAuth/Auth.js、邮箱、Google、LINE", "完善账号合并、伪邮箱与注销流程"],
            ["文件", "Cloudinary 或兼容对象存储", "签名上传、类型/大小限制、恶意文件扫描和软删除"],
            ["地图", "MapLibre/Leaflet + 地理编码", "缓存地理编码，限制速率，公开位置模糊化"],
            ["通知", "Nodemailer + 队列/定时任务", "站内通知为主，邮件重试与退订"],
            ["测试", "Vitest、Playwright、Storybook", "覆盖状态机、权限、三语言与移动端核心路径"],
        ],
        [1500, 3000, 4860],
        font_size=8.6,
    )
    d.h2("10.2 当前代码基础评估（2026-08-03 工作区）")
    d.matrix(
        ["已具备基础", "仍需完成/重构"],
        [
            ["首页、附近需求/服务者展示与照护类型内容页", "公开服务详情、统一筛选、可见性查询和 SEO 完整性"],
            ["邮箱/Google/LINE 认证框架与 dashboard 路由保护", "账号合并、安全限制、设置持久化、注销与权限全覆盖"],
            ["需求表单、详情页、三种类型的引导式发布 UI 基础", "把向导字段正式映射到数据库/API，完成草稿、版本与复杂任务结构"],
            ["服务者资料、服务表单、价格规则与附件", "容量、日历例外、体型年龄、优惠、批量更新和服务预约关联"],
            ["Prisma 中已有 Application、Booking、Message 雏形", "路由尚未聚合；消息页/通知仍为 mock；状态和默认值与业务规则不一致"],
            ["zh/ja/en 文案文件和语言 Provider", "清除硬编码中日英混排，覆盖错误、邮件、状态和 SEO 文案"],
        ],
        [4300, 5060],
        font_size=8.7,
    )
    d.h2("10.3 优先技术债")
    for text in [
        "Booking 当前默认 CONFIRMED，必须改为 PENDING，并补 serviceId、拒绝/撤回状态与状态历史。",
        "Message 当前仅 fromId/toId，必须引入 Conversation，否则无法稳定关联咨询、需求申请和服务预约。",
        "Favorite、Notification、Report、Review、Block、地址隐私等实体尚缺。",
        "公开需求详情中的收藏与应聘目前存在前端本地状态，应接入真实接口和登录拦截。",
        "needs/create 引导式文件体积很大，应按模式/步骤拆分，建立共享表单 schema 和测试。",
        "现有工作区有未提交改动，正式实施前先建立基线分支、迁移策略和可回滚版本。",
    ]:
        d.list_item(text)
    d.page_break()

    d.h1("11. 非功能需求、安全与合规")
    d.h2("11.1 性能与可用性")
    d.matrix(
        ["指标", "V1 目标"],
        [
            ["公开页性能", "移动端 LCP ≤ 2.5 秒（p75），CLS ≤ 0.1；图片自适应和懒加载"],
            ["API", "列表/详情 p95 ≤ 800 ms；写操作 p95 ≤ 1.5 秒（不含文件上传和邮件）"],
            ["搜索", "常用组合筛选 p95 ≤ 1 秒；地理与状态/时间字段建立索引"],
            ["可用性", "月度 99.5%；数据库每日备份，RPO ≤ 24 小时、RTO ≤ 8 小时"],
            ["容量假设", "首版 10 万用户、10 万公开内容、日活 5,000；超出后重新压测"],
        ],
        [2200, 7160],
    )
    d.h2("11.2 安全控制")
    for text in [
        "密码哈希、CSRF/会话保护、登录与验证码限流、敏感接口二次校验、依赖漏洞扫描。",
        "上传文件校验 MIME、扩展名、大小和像素；使用签名 URL；移除 EXIF 地理信息。",
        "XSS/富文本清洗、消息反垃圾、恶意链接提示、举报与封禁。",
        "住址、坐标、邮箱和医疗备注最小权限访问；日志中脱敏，不把个人信息写入前端分析事件。",
        "管理员使用独立权限和操作审计；生产数据库访问最小化，密钥放环境变量/密钥服务。",
    ]:
        d.list_item(text)
    d.h2("11.3 隐私与法律页面")
    d.p("上线前至少准备服务条款、隐私政策、社区/安全规则、外部知识链接声明、Cookie/分析说明、未成年人使用限制和平台非雇佣/非医疗服务声明。具体文本需由目标运营地区的专业法律顾问审核；本计划不替代法律意见。")
    d.h2("11.4 无障碍与兼容性")
    for text in [
        "目标 WCAG 2.1 AA：键盘操作、焦点可见、表单标签、错误摘要、对比度、替代文本。",
        "支持当前及前一个主版本的 Chrome、Safari、Edge、Firefox；重点覆盖 iOS Safari 与 Android Chrome。",
        "三语言长文本、日文换行、货币和日期格式必须进入视觉回归测试。",
    ]:
        d.list_item(text)
    d.page_break()

    d.h1("12. 实施计划、团队与交付物")
    d.h2("12.1 16 周建议路线图")
    d.matrix(
        ["阶段", "周期", "目标与主要交付"],
        [
            ["0. 基线与定稿", "第 1 周", "确认范围/状态机/字段；盘点现有分支；建立 CI、环境和迁移基线；关键页面原型评审"],
            ["1. 账号与基础数据", "第 2–4 周", "认证强化、个人/宠物/地址、隐私、i18n 框架清理、公开查询规则、收藏"],
            ["2. 需求闭环", "第 5–7 周", "三类需求 schema/API、草稿/预览/编辑、筛选、过期、申请与恢复公开"],
            ["3. 服务闭环", "第 8–10 周", "服务者开通、三类服务、可用日历/容量/优惠、批量管理、预约请求"],
            ["4. 沟通与确认", "第 11–13 周", "会话/消息、系统事件、未读、应聘/预约确认取消、邮件与站内通知"],
            ["5. 信任与上线", "第 14–16 周", "评价/举报/后台、知识页、SEO、性能/安全/无障碍、数据种子、灰度发布"],
            ["上线缓冲", "+2 周", "真实用户试用、内容审核、迁移修复、监控阈值与回滚演练"],
        ],
        [2100, 1300, 5960],
        font_size=8.7,
    )
    d.h2("12.2 建议团队职责")
    d.matrix(
        ["角色", "投入", "职责"],
        [
            ["产品负责人", "1", "范围、字段和状态机、验收、运营政策、跨语言内容"],
            ["产品/UI 设计", "0.5–1", "发布向导、消息/状态、响应式和无障碍、设计系统"],
            ["全栈开发", "2–3", "前后端、数据库迁移、地图/文件/邮件集成、测试"],
            ["测试/质量", "0.5–1", "用例、自动化、跨浏览器/语言、回归与发布门禁"],
            ["运维/安全", "0.2–0.5", "环境、监控、备份、漏洞与事故响应"],
            ["内容/客服", "0.5", "知识链接、邮件模板、举报处理、试运营反馈"],
        ],
        [1800, 1000, 6560],
    )
    d.h2("12.3 每阶段固定交付物")
    for text in [
        "确认版用户故事、字段表、状态图和验收标准。",
        "数据库迁移、API 契约、权限矩阵和错误码。",
        "桌面/移动/三语言页面与空、错、加载、权限、过期等状态。",
        "单元/集成/端到端测试，迁移回滚说明和发布说明。",
        "演示环境、产品负责人验收记录及未解决风险清单。",
    ]:
        d.list_item(text)
    d.h2("12.4 Definition of Done")
    d.callout("完成定义", "代码评审通过；关键测试通过；无 P0/P1 已知缺陷；三语言核心路径检查；权限与审计覆盖；迁移可回滚；监控已接入；产品验收通过；文档与客服说明同步。", fill=GREEN_LIGHT, border=GREEN)
    d.page_break()

    d.h1("13. 测试策略与验收标准")
    d.h2("13.1 自动化测试分层")
    d.matrix(
        ["层级", "重点"],
        [
            ["单元测试", "日期/频率展开、价格计算、公开可见性、容量、状态转换、货币与 locale 格式"],
            ["API/集成", "鉴权与归属、并发接受申请、预约容量、收藏过期保留、消息会话隔离、事务回滚"],
            ["端到端", "游客→登录回跳→应聘；发布需求→接受→取消→恢复；预约→确认→容量更新；三语言切换"],
            ["视觉/无障碍", "桌面/移动关键页截图、长文案、键盘、焦点、表单错误、颜色对比"],
            ["安全/性能", "限流、越权、上传、XSS、敏感地址泄露；列表/地理查询与消息负载压测"],
        ],
        [1900, 7460],
    )
    d.h2("13.2 P0 业务验收清单")
    checks = [
        "未登录用户能浏览需求、服务者和服务；应聘/预约时必须登录且成功回到原页面。",
        "点击应聘或预约后只显示待确认；接收方接受后才显示成功。",
        "接受某应聘者后需求从公开搜索消失；取消该服务者且未过期时可恢复公开。",
        "公开搜索永远不返回过期、已匹配、已关闭或已删除需求；收藏夹仍能显示过期项目。",
        "三类需求保存各自结构化字段，预览与详情完整呈现；编辑后数据不丢失。",
        "三类服务支持独立启停、删除/归档；服务者资料可暂停/开启全部及批量改地点/货币。",
        "服务预约必须选择时间段；详情页能按日期显示确认数量并正确释放取消容量。",
        "有服务资料的应聘者显示资料入口；无资料者显示风险提示。",
        "聊天按业务对象隔离、未读可追踪；邮箱验证并开启提醒时可收到安全摘要。",
        "中文、日文、英文覆盖首页、列表、详情、发布、消息、状态与关键错误。",
        "精确地址和坐标不会出现在游客接口、页面源码、分析事件或邮件中。",
        "管理员能查看举报、下架内容、暂停用户并追踪高风险操作。",
    ]
    for item in checks:
        d.list_item("□ " + item)
    d.h2("13.3 发布门禁")
    d.p("灰度上线前必须完成生产备份恢复演练、邮件退订验证、隐私页面审核、第三方服务配额检查、关键告警测试和回滚演练。任何可能造成双重确认、精确地址泄露、越权读取消息或数据不可恢复的缺陷均为阻断级。")
    d.page_break()

    d.h1("14. 指标、风险与上线运营")
    d.h2("14.1 核心指标")
    d.matrix(
        ["类别", "指标", "建议首期观察"],
        [
            ["供给", "有公开服务的活跃服务者、服务资料完成率、可服务日期覆盖", "每周趋势"],
            ["需求", "公开需求数、发布完成率、需求 7 天内首个应聘率", "按地区/类型拆分"],
            ["撮合", "咨询→申请率、申请→接受率、预约确认率、发布到确认中位时长", "核心北极星"],
            ["沟通", "首响时间、24 小时回复率、未读积压、邮件回站率", "只采集必要事件"],
            ["质量", "取消率、举报率、完成后评价率、严重安全事件", "作为增长护栏"],
            ["技术", "错误率、p95 延迟、邮件失败率、上传失败率、可用性", "告警与周报"],
        ],
        [1500, 4800, 3060],
        font_size=8.7,
    )
    d.h2("14.2 主要风险与应对")
    d.matrix(
        ["风险", "影响", "应对"],
        [
            ["复杂表单范围膨胀", "延期、数据结构反复", "冻结字段词典；自定义任务承接长尾；按模式拆组件"],
            ["供需冷启动", "用户看不到匹配内容", "按地区试运营、内容种子、邀请首批服务者、保存搜索提醒"],
            ["住址与行程泄露", "人身与宠物安全", "公开模糊位置、确认后按需共享、日志脱敏与举报"],
            ["双方确认并发", "双重预约/匹配", "数据库事务、唯一约束、幂等键、并发测试"],
            ["消息骚扰/诈骗", "信任下降", "限流、屏蔽举报、链接提示、风控规则和后台处置"],
            ["三语言不一致", "流程误解", "稳定枚举、翻译检查、语言 QA、用户内容不强制翻译"],
            ["第三方地图/邮件限额", "搜索或通知中断", "缓存/退避、配额告警、可替换适配层"],
            ["未提交代码和迁移冲突", "上线不稳定", "先冻结基线、拆分迁移、小步合并、预演回滚"],
        ],
        [2350, 2600, 4410],
        font_size=8.5,
    )
    d.h2("14.3 上线策略")
    for text in [
        "内部环境：用种子账号覆盖三种需求/服务、过期、无服务资料和满容量等状态。",
        "邀请测试：20–50 名用户，限定 1–2 个地区，人工跟踪每次申请和预约。",
        "灰度公开：先开放浏览与发布，再逐步开放邮件、评价和更多地区；高风险功能用开关控制。",
        "正式运营：建立举报 SLA、知识死链检查、每周指标复盘和每月安全/备份检查。",
    ]:
        d.list_item(text, numbered=True)
    d.page_break()

    d.h1("15. 待确认决策与下一步")
    d.h2("15.1 开发启动前必须确认")
    d.matrix(
        ["决策", "本计划默认假设"],
        [
            ["首发地区与法律主体", "先在日本主要城市试运营；具体主体与条款另行确认"],
            ["平台收费方式", "V1 不在平台内付款、不抽成；仅展示和记录费用"],
            ["服务者身份验证", "V1 邮箱/第三方账号验证，不承诺实名或资质认证"],
            ["地址共享时点", "公开仅模糊区域；双方确认后由发布者主动共享详细地址"],
            ["取消与违约", "V1 记录原因和次数，不自动收取消费；后续结合支付再制定"],
            ["消息实时性", "V1 近实时轮询；确认增长需求后再升级 WebSocket"],
            ["知识库责任", "只展示标题、摘要、来源与外链；不复制全文，不提供医疗诊断"],
            ["服务者评价", "仅完成后的双方互评；防止未成交用户恶意评价"],
        ],
        [3200, 6160],
    )
    d.h2("15.2 建议立即开展的五项工作")
    for text in [
        "批准本计划的 V1/P2 边界，并指定产品决策人。",
        "把六种发布模式整理成字段词典、验证规则和示例数据，冻结第一版 schema。",
        "重构 Application/Booking/Conversation 状态机和数据库迁移方案，先解决底层闭环。",
        "从当前未提交改动建立可运行基线，补 CI、迁移检查和核心 E2E。",
        "招募首批试用用户，验证发布表单是否能表达真实照护安排与费用。",
    ]:
        d.list_item(text, numbered=True)
    d.callout("最终建议", "先把“可靠地找到人并双方确认”做到完整、可追踪、可恢复，再增加支付和平台担保。Petnido 的竞争力不在于功能数量，而在于把复杂宠物照护安排表达清楚，并让双方在安全边界内完成确认。", fill=PURPLE_LIGHT, border=PURPLE)

    d.h1("附录 A：需求追踪总表")
    d.matrix(
        ["用户原始要求", "计划对应章节", "V1"],
        [
            ["游客浏览，操作前登录", "3、4、7", "是"],
            ["应聘/预约先发消息，对方确认才成功", "3、7、9", "是"],
            ["三类需求及差异字段", "5", "是"],
            ["地点/预算/宠物/任务/时间筛选", "4.3", "是"],
            ["详情、收藏、咨询、应聘、聊天、邮件", "4、7", "是"],
            ["过期需求公开隐藏但收藏可见", "4.4、9.3", "是"],
            ["个人资料、宠物档案、位置", "4.2", "是"],
            ["开启接单确认与服务者资料", "6.1", "是"],
            ["三类服务、多服务、启停/删除", "6.3–6.6", "是"],
            ["服务资料批量开关/地点/货币", "6.2", "是"],
            ["无服务资料应聘风险提示", "7.3", "是"],
            ["接受服务者后需求隐藏，可取消恢复", "5.4、7.3", "是"],
            ["预约时间与已确认数量", "6.6、7.4", "是"],
            ["三类照护介绍页与知识链接", "8.1–8.2", "是"],
            ["三语言切换", "8.3", "是"],
        ],
        [4700, 2860, 1800],
        font_size=8.5,
    )
    d.p("说明：本追踪表覆盖用户本次提出的全部功能，并在正文中增加了隐私、状态历史、评价举报、后台、指标、测试、性能与上线运营等完成一个可运营平台所必需的内容。")

    # Keep table rows and headings as intact as possible.
    for table in d.doc.tables:
        for row in table.rows:
            prevent_row_split(row)
    d.doc.save(OUTPUT)
    return OUTPUT


if __name__ == "__main__":
    print(build_document())
