from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "deliverables" / "Petnido网站项目计划书_v2.0.docx"


# compact_reference_guide preset, with a named Unicode font override so the
# same glyph source is used by Word and headless LibreOffice for Chinese text.
FONT_LATIN = "Arial Unicode MS"
FONT_CJK = "Arial Unicode MS"
NAVY = "17365D"
BLUE = "2E74B5"
DARK_BLUE = "1F4D78"
MUTED = "5F6B7A"
LIGHT_BLUE = "E8EEF5"
LIGHTER_BLUE = "F4F7FB"
LIGHT_GRAY = "F2F4F7"
BORDER = "C9D2DE"
WHITE = "FFFFFF"


def set_run_font(run, size=None, bold=None, italic=None, color=None, latin=FONT_LATIN, cjk=FONT_CJK):
    run.font.name = latin
    if run._element.get_or_add_rPr().rFonts is None:
        rfonts = OxmlElement("w:rFonts")
        run._element.get_or_add_rPr().insert(0, rfonts)
    rfonts = run._element.get_or_add_rPr().rFonts
    rfonts.set(qn("w:ascii"), latin)
    rfonts.set(qn("w:hAnsi"), latin)
    rfonts.set(qn("w:eastAsia"), cjk)
    rfonts.set(qn("w:cs"), cjk)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic
    if color is not None:
        run.font.color.rgb = RGBColor.from_string(color)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for tag, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{tag}"))
        if node is None:
            node = OxmlElement(f"w:{tag}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_geometry(table, widths_dxa, indent_dxa=120):
    total = sum(widths_dxa)
    tbl_pr = table._tbl.tblPr
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(total))
    tbl_w.set(qn("w:type"), "dxa")

    tbl_ind = tbl_pr.find(qn("w:tblInd"))
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), str(indent_dxa))
    tbl_ind.set(qn("w:type"), "dxa")

    layout = tbl_pr.find(qn("w:tblLayout"))
    if layout is None:
        layout = OxmlElement("w:tblLayout")
        tbl_pr.append(layout)
    layout.set(qn("w:type"), "fixed")

    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths_dxa:
        grid_col = OxmlElement("w:gridCol")
        grid_col.set(qn("w:w"), str(width))
        grid.append(grid_col)

    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            width = widths_dxa[idx]
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(width))
            tc_w.set(qn("w:type"), "dxa")
            set_cell_margins(cell)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER


def keep_row_together(row):
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = tr_pr.find(qn("w:cantSplit"))
    if cant_split is None:
        cant_split = OxmlElement("w:cantSplit")
        cant_split.set(qn("w:val"), "true")
        tr_pr.append(cant_split)


def add_bottom_border(paragraph, color=BORDER, size=8):
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is None:
        p_bdr = OxmlElement("w:pBdr")
        p_pr.append(p_bdr)
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(size))
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), color)
    p_bdr.append(bottom)


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("第 ")
    set_run_font(run, size=9, color=MUTED)
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = " PAGE "
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.extend([fld_char1, instr_text, fld_char2])
    run2 = paragraph.add_run(" 页")
    set_run_font(run2, size=9, color=MUTED)


def configure_document(doc):
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.header_distance = Inches(0.492)
    section.footer_distance = Inches(0.492)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = FONT_LATIN
    normal._element.rPr.rFonts.set(qn("w:ascii"), FONT_LATIN)
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), FONT_LATIN)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_CJK)
    normal._element.rPr.rFonts.set(qn("w:cs"), FONT_CJK)
    normal.font.size = Pt(11)
    normal.font.color.rgb = RGBColor.from_string("222222")
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.25

    heading_specs = {
        "Heading 1": (16, BLUE, 18, 10),
        "Heading 2": (13, BLUE, 14, 7),
        "Heading 3": (12, DARK_BLUE, 10, 5),
    }
    for name, (size, color, before, after) in heading_specs.items():
        style = styles[name]
        style.font.name = FONT_LATIN
        style._element.rPr.rFonts.set(qn("w:ascii"), FONT_LATIN)
        style._element.rPr.rFonts.set(qn("w:hAnsi"), FONT_LATIN)
        style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_CJK)
        style._element.rPr.rFonts.set(qn("w:cs"), FONT_CJK)
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True

    for name in ("List Bullet", "List Number"):
        style = styles[name]
        style.font.name = FONT_LATIN
        style._element.rPr.rFonts.set(qn("w:ascii"), FONT_LATIN)
        style._element.rPr.rFonts.set(qn("w:hAnsi"), FONT_LATIN)
        style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_CJK)
        style._element.rPr.rFonts.set(qn("w:cs"), FONT_CJK)
        style.font.size = Pt(11)
        style.paragraph_format.left_indent = Inches(0.375)
        style.paragraph_format.first_line_indent = Inches(-0.188)
        style.paragraph_format.space_after = Pt(4)
        style.paragraph_format.line_spacing = 1.25

    for sec in doc.sections:
        header_p = sec.header.paragraphs[0]
        header_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = header_p.add_run("PETNIDO  ·  网站项目计划书")
        set_run_font(run, size=9, bold=True, color=MUTED)
        add_bottom_border(header_p, color=BORDER, size=6)
        add_page_number(sec.footer.paragraphs[0])


def add_para(doc, text="", bold_lead=None, italic=False, color=None, align=None, before=0, after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = 1.25
    if align is not None:
        p.alignment = align
    if bold_lead and text.startswith(bold_lead):
        r1 = p.add_run(bold_lead)
        set_run_font(r1, size=11, bold=True, color=color)
        r2 = p.add_run(text[len(bold_lead):])
        set_run_font(r2, size=11, italic=italic, color=color)
    else:
        r = p.add_run(text)
        set_run_font(r, size=11, italic=italic, color=color)
    return p


def add_bullets(doc, items, level=0):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.left_indent = Inches(0.375 + level * 0.25)
        p.paragraph_format.first_line_indent = Inches(-0.188)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.25
        run = p.add_run(item)
        set_run_font(run, size=11)


def add_numbered(doc, items):
    numbering = doc.part.numbering_part.element
    abstract_ids = [
        int(node.get(qn("w:abstractNumId")))
        for node in numbering.findall(qn("w:abstractNum"))
        if node.get(qn("w:abstractNumId")) is not None
    ]
    num_ids = [
        int(node.get(qn("w:numId")))
        for node in numbering.findall(qn("w:num"))
        if node.get(qn("w:numId")) is not None
    ]
    abstract_id = max(abstract_ids, default=0) + 1
    num_id = max(num_ids, default=0) + 1

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
    num_fmt.set(qn("w:val"), "decimal")
    lvl_text = OxmlElement("w:lvlText")
    lvl_text.set(qn("w:val"), "%1.")
    lvl_jc = OxmlElement("w:lvlJc")
    lvl_jc.set(qn("w:val"), "left")
    p_pr = OxmlElement("w:pPr")
    tabs = OxmlElement("w:tabs")
    tab = OxmlElement("w:tab")
    tab.set(qn("w:val"), "num")
    tab.set(qn("w:pos"), "540")
    tabs.append(tab)
    ind = OxmlElement("w:ind")
    ind.set(qn("w:left"), "540")
    ind.set(qn("w:hanging"), "270")
    spacing = OxmlElement("w:spacing")
    spacing.set(qn("w:after"), "80")
    spacing.set(qn("w:line"), "300")
    spacing.set(qn("w:lineRule"), "auto")
    p_pr.extend([tabs, ind, spacing])
    lvl.extend([start, num_fmt, lvl_text, lvl_jc, p_pr])
    abstract.append(lvl)
    numbering.append(abstract)

    num = OxmlElement("w:num")
    num.set(qn("w:numId"), str(num_id))
    abstract_ref = OxmlElement("w:abstractNumId")
    abstract_ref.set(qn("w:val"), str(abstract_id))
    num.append(abstract_ref)
    numbering.append(num)

    for item in items:
        p = doc.add_paragraph()
        p_pr = p._p.get_or_add_pPr()
        num_pr = OxmlElement("w:numPr")
        ilvl = OxmlElement("w:ilvl")
        ilvl.set(qn("w:val"), "0")
        num_id_node = OxmlElement("w:numId")
        num_id_node.set(qn("w:val"), str(num_id))
        num_pr.extend([ilvl, num_id_node])
        p_pr.insert(0, num_pr)
        p.paragraph_format.left_indent = Inches(0.375)
        p.paragraph_format.first_line_indent = Inches(-0.188)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.25
        run = p.add_run(item)
        set_run_font(run, size=11)


def add_heading(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    p.paragraph_format.keep_with_next = True
    return p


def add_callout(doc, label, text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = False
    set_table_geometry(table, [9360], indent_dxa=120)
    cell = table.cell(0, 0)
    set_cell_shading(cell, LIGHTER_BLUE)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.2
    r1 = p.add_run(f"{label}  ")
    set_run_font(r1, size=10.5, bold=True, color=NAVY)
    r2 = p.add_run(text)
    set_run_font(r2, size=10.5, color=NAVY)
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(2)


def add_table(doc, headers, rows, widths_dxa):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = False
    table.style = "Table Grid"
    hdr = table.rows[0]
    for idx, text in enumerate(headers):
        cell = hdr.cells[idx]
        set_cell_shading(cell, LIGHT_BLUE)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(text)
        set_run_font(run, size=9.5, bold=True, color=NAVY)
    tr_pr = hdr._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)
    keep_row_together(hdr)

    for row in rows:
        added_row = table.add_row()
        keep_row_together(added_row)
        cells = added_row.cells
        for idx, text in enumerate(row):
            p = cells[idx].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            if idx == 0 and len(headers) <= 3:
                r = p.add_run(str(text))
                set_run_font(r, size=9.5, bold=True, color=DARK_BLUE)
            else:
                r = p.add_run(str(text))
                set_run_font(r, size=9.5)
    set_table_geometry(table, widths_dxa, indent_dxa=120)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_cover(doc):
    for _ in range(4):
        doc.add_paragraph()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(18)
    r = p.add_run("PRODUCT PLAN · V2.0")
    set_run_font(r, size=11, bold=True, color=BLUE)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(10)
    r = p.add_run("PETNIDO")
    set_run_font(r, size=34, bold=True, color=NAVY)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run("宠物照护需求与服务撮合平台")
    set_run_font(r, size=18, bold=True, color=DARK_BLUE)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(32)
    r = p.add_run("网站项目计划书")
    set_run_font(r, size=15, color=MUTED)

    add_callout(
        doc,
        "版本说明",
        "本版已依据完整用户操作流程重新整理，重点修正首次与非首次登录分流、表单内档案读取、发布成功后档案写入、邮箱通知检查，以及需求与服务的双向推荐。",
    )

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(26)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("版本：V2.0   |   日期：2026年8月4日   |   状态：产品定义稿")
    set_run_font(r, size=10, color=MUTED)
    doc.add_page_break()


def add_contents(doc):
    add_heading(doc, "文档导航", 1)
    add_para(doc, "本计划书按用户行为和产品模块组织，可作为产品设计、交互设计、技术拆分与验收的共同基线。", color=MUTED)
    groups = [
        ("01–04", "项目定位、目标、范围、角色与权限"),
        ("05–07", "登录引导、个人档案、需求发布"),
        ("08–10", "服务发布、公开浏览、咨询应聘与预约"),
        ("11–14", "消息通知、状态规则、匹配推荐、页面结构"),
        ("15–18", "数据模型、国际化、非功能要求、实施路线"),
        ("19–21", "验收标准、风险与后续范围、附录"),
    ]
    add_table(doc, ["章节", "内容"], groups, [1700, 7660])
    add_callout(doc, "当前范围", "本阶段仅规划用户端核心业务，不包含运营后台、投诉仲裁、平台抽佣、在线支付与实名认证。")
    doc.add_page_break()


def build_document():
    doc = Document()
    configure_document(doc)
    add_cover(doc)
    add_contents(doc)

    add_heading(doc, "1. 项目概述", 1)
    add_para(doc, "Petnido 是一个连接宠物主人与宠物照护服务者的平台。同一账号既可以发布宠物照护需求，也可以开启接单模式、建立服务档案并发布多个服务。")
    add_para(doc, "平台围绕三类业务建立统一撮合体系：上门照护、宠物寄养和自定义服务。游客可浏览公开信息；收藏、咨询、应聘、预约、发布和聊天等行为需要登录。")
    add_callout(doc, "产品原则", "减少重复填写，但不打乱用户的自然表单顺序。档案只在表单进行到相应步骤时提供默认值，并在发布成功后才自动保存或更新。")

    add_heading(doc, "2. 项目目标与成功标准", 1)
    add_heading(doc, "2.1 核心目标", 2)
    add_bullets(doc, [
        "帮助宠物主人快速发布结构化照护需求。",
        "帮助服务者展示经验、服务范围、价格和可用时间，并管理多个服务。",
        "根据地点、宠物、时间、任务和预算完成双向撮合。",
        "通过站内消息完成咨询、应聘、预约和双方确认。",
        "沉淀宠物、地址和服务档案，降低后续发布成本。",
        "支持三种语言和多货币，为跨地区使用预留基础。",
    ])
    add_heading(doc, "2.2 第一阶段成功标准", 2)
    add_bullets(doc, [
        "游客能够浏览附近需求、服务者和公开服务。",
        "首次注册用户能够完成头像、昵称和首个发布引导。",
        "非首次用户登录后直接进入个人中心，不被强制引导查看消息。",
        "需求方与服务者能够分别完成申请/预约、沟通和确认闭环。",
        "过期需求不再公开展示，但仍可在个人记录和收藏夹中查看。",
        "发布成功后能够触发邮箱通知检查及匹配推荐。",
    ])

    add_heading(doc, "3. 项目范围", 1)
    add_heading(doc, "3.1 本阶段包含", 2)
    add_bullets(doc, [
        "账号注册登录、首次使用引导和个人中心。",
        "个人资料、宠物档案、地址档案和服务档案。",
        "三种需求模式和三种服务模式。",
        "公开浏览、地图/列表展示、筛选、收藏和详情页。",
        "站内聊天、咨询、应聘、预约和状态确认。",
        "邮件消息通知、需求过期、匹配推荐和三语言切换。",
        "服务单项管理和批量管理。",
        "服务类型介绍及宠物照护知识链接库。",
    ])
    add_heading(doc, "3.2 本阶段不包含", 2)
    add_bullets(doc, [
        "运营管理后台、举报投诉和平台仲裁。",
        "实名认证、背景调查、平台保险和信用等级。",
        "在线支付、平台抽佣、退款和赔付。",
        "公开评价体系、视频通话和聊天自动翻译。",
        "智能定价及复杂营销工具。",
    ])

    add_heading(doc, "4. 用户角色与权限", 1)
    role_rows = [
        ("游客", "浏览首页、附近需求、服务者、公开服务、详情、类型介绍和照护知识；切换语言。", "收藏、咨询、应聘、预约、发布和聊天。"),
        ("注册用户", "编辑资料、管理宠物/地址、发布需求、收藏、咨询、应聘、预约和聊天。", "未开启接单模式时不能发布服务。"),
        ("服务者", "拥有注册用户全部能力；建立服务档案、发布多个服务、处理预约、管理接单状态。", "关闭接单模式后，公开服务按规则暂停。"),
    ]
    add_table(doc, ["角色", "可执行操作", "限制"], role_rows, [1500, 5000, 2860])
    add_para(doc, "同一账号可以同时拥有需求方和服务者能力，不创建互斥的角色账号。", bold_lead="同一账号")

    add_heading(doc, "5. 登录、注册与首次使用", 1)
    add_heading(doc, "5.1 首次注册", 2)
    add_numbered(doc, [
        "用户完成账号注册和登录。",
        "引导完善头像和昵称。",
        "询问用户当前希望发布需求、提供服务，或暂时跳过。",
        "选择发布需求时，直接进入需求发布流程。",
        "选择提供服务时，先确认开启接单模式并创建服务档案，再选择服务类型。",
        "选择暂时跳过时，进入个人中心。",
    ])
    add_heading(doc, "5.2 非首次登录", 2)
    add_para(doc, "非首次用户登录成功后直接进入个人中心。系统不弹出“是否查看新消息”的提示，由用户自行选择消息中心、我的需求、我的服务等入口。")
    add_heading(doc, "5.3 登录后返回原操作", 2)
    add_para(doc, "游客从需求或服务详情触发收藏、咨询、应聘或预约时，先进入登录/注册；成功后返回原详情页，并恢复登录前准备执行的操作。")

    add_heading(doc, "6. 个人资料与可复用档案", 1)
    add_heading(doc, "6.1 基础资料", 2)
    add_bullets(doc, ["头像与昵称", "个人简介", "所在地区与大致地理位置", "常用语言", "绑定邮箱、验证状态和邮件通知开关"])
    add_heading(doc, "6.2 宠物档案", 2)
    add_bullets(doc, [
        "名称、类型、品种、性别、年龄或生日。",
        "体型、体重、是否绝育、照片。",
        "性格、饮食、健康、过敏、用药和疫苗。",
        "与人或其他动物的相处情况及照护注意事项。",
    ])
    add_heading(doc, "6.3 地址档案", 2)
    add_bullets(doc, [
        "地址名称、国家/城市、详细地址和经纬度。",
        "到达说明、门禁说明、是否设为默认地址。",
        "公开页面仅显示大致区域，详细地址仅在必要业务阶段向相关用户展示。",
    ])
    add_heading(doc, "6.4 服务档案", 2)
    add_bullets(doc, [
        "个人介绍、照护经验、擅长宠物类型和相关证明。",
        "默认服务地点、服务范围和常用货币单位。",
        "接单模式状态及全部服务批量管理入口。",
    ])

    add_heading(doc, "7. 需求发布系统", 1)
    add_heading(doc, "7.1 通用表单与档案规则", 2)
    add_numbered(doc, [
        "用户先选择上门、寄养或自定义需求，按该类型的正常顺序填写。",
        "表单进行到宠物步骤时，读取宠物档案；有档案则选择，没有则在当前表单新建。",
        "继续填写时间、任务、物资或环境等当前类型内容。",
        "表单进行到地址步骤时，读取默认地址；用户可使用、切换或修改，没有则新建。",
        "填写费用和其他后续信息，进入预览并确认发布。",
        "仅在发布成功后，将本次宠物资料和地址保存或更新到个人档案。",
    ])
    add_callout(doc, "数据边界", "需求中的宠物和地址必须保存发布时快照。用户以后修改个人档案，不应改变已发布或历史需求。")

    add_heading(doc, "7.2 上门需求字段", 2)
    add_bullets(doc, [
        "照护宠物、开始/结束日期、每隔几天上门一次。",
        "每个上门日次数、每次期望时间段及可浮动范围。",
        "每次对哪些宠物执行哪些任务，如喂食、换水、清洁、遛宠、陪伴、用药。",
        "服务地址、总预算或按次预算、是否支付交通费及计算方式。",
        "补充说明和紧急联系信息。",
    ])
    add_heading(doc, "7.3 寄养需求字段", 2)
    add_bullets(doc, [
        "寄养宠物、开始/结束时间及每日任务。",
        "主人自带物品、寄养家庭需准备物品及费用规则。",
        "定期/不定期任务、执行时间和特殊照护说明。",
        "期望寄养环境、不可接受情况、是否允许环境中有其他宠物。",
        "接送方式、出发地、可接受距离、寄养预算和交通费用规则。",
    ])
    add_heading(doc, "7.4 自定义需求字段", 2)
    add_bullets(doc, ["一个或多个宠物", "服务日期和时间", "地点", "任务及期望结果", "预算、交通或材料费", "补充说明"])
    add_heading(doc, "7.5 需求状态", 2)
    add_table(doc, ["状态", "公开展示", "说明"], [
        ("草稿", "否", "尚未发布，可继续编辑。"),
        ("公开招募中", "是", "未过期时可搜索、咨询和应聘。"),
        ("等待确认", "视业务规则", "已有申请进入重点沟通，但尚未成功。"),
        ("已找到服务者", "否", "发布者已确认某位服务者。"),
        ("已取消", "否", "发布者主动取消。"),
        ("已过期", "否", "超过有效时间；个人记录和收藏仍可查看。"),
        ("已完成", "否", "服务周期结束并归档。"),
    ], [1800, 1600, 5960])

    add_heading(doc, "8. 服务档案与服务发布", 1)
    add_heading(doc, "8.1 开启接单模式", 2)
    add_para(doc, "没有服务档案的用户首次发布服务时，平台提示“确认开启接单模式吗？”。确认后填写个人介绍和经验，再选择服务类型。已有服务档案则直接读取现有资料。")
    add_heading(doc, "8.2 表单内默认值规则", 2)
    add_numbered(doc, [
        "用户选择服务类型并按正常顺序填写。",
        "到达服务地点步骤时读取服务档案；有默认地点则预填并允许修改，没有则填写新地点。",
        "继续填写服务内容、环境、证明、时间和限制条件。",
        "到达费用与货币步骤时读取常用货币；有则默认选中并允许修改，没有则选择。",
        "预览并确认发布。",
        "仅在发布成功后，将本次地点和货币保存或更新到服务档案。",
    ])
    add_heading(doc, "8.3 上门服务字段", 2)
    add_bullets(doc, [
        "服务地点、服务半径、可服务日期和每日时间段。",
        "平日、周末、节假日、日期范围及排除日期。",
        "宠物类型、体型和年龄限制。",
        "经验、证明照片、可提供任务和单次时长。",
        "收费方式、货币、交通费、优惠和并发订单量。",
    ])
    add_heading(doc, "8.4 寄养服务字段", 2)
    add_bullets(doc, [
        "可寄养宠物类型、体型、年龄和日期。",
        "寄养地址、服务范围、环境照片和居住环境。",
        "家庭成员、已有宠物、庭院情况和可提供物资。",
        "接待条件、限制、单次最大宠物数量。",
        "接送能力和范围、收费、货币、物资/交通费及优惠。",
    ])
    add_heading(doc, "8.5 自定义服务字段", 2)
    add_bullets(doc, ["服务名称、时间和地点", "服务内容和宠物类型", "经验、照片和证明", "服务限制", "费用、货币和优惠"])
    add_heading(doc, "8.6 服务管理", 2)
    add_bullets(doc, [
        "创建和管理多个服务。",
        "编辑、暂停、开启或删除单个服务。",
        "从服务档案暂停或开启全部服务。",
        "批量修改全部服务地点或货币单位；执行前展示受影响服务并二次确认。",
    ])

    add_heading(doc, "9. 公开浏览、搜索与收藏", 1)
    add_heading(doc, "9.1 需求浏览", 2)
    add_para(doc, "需求列表和地图展示类型、宠物、数量、大致地点、日期、预算、任务、发布时间、交通费和紧急程度。")
    add_bullets(doc, ["地点与距离", "预算与货币", "宠物类型与体型", "任务类别", "需求类型", "时间范围", "是否支付交通费", "排序方式"])
    add_heading(doc, "9.2 服务与服务者浏览", 2)
    add_para(doc, "列表展示服务者头像、昵称、大致地点、经验摘要、可服务宠物、公开服务和可用时间。服务详情显示内容、价格、条件、环境/证明照片，以及所选日期已有的成功预约数量。")
    add_bullets(doc, ["服务类型", "地点与距离", "时间", "宠物类型/体型/年龄", "价格与货币", "是否接送", "剩余容量"])
    add_heading(doc, "9.3 收藏", 2)
    add_para(doc, "登录用户可收藏需求、服务和服务者。收藏夹保留已过期需求，但必须显示“已过期”并禁用咨询和应聘。")

    add_heading(doc, "10. 咨询、应聘与预约", 1)
    add_heading(doc, "10.1 应聘需求", 2)
    add_numbered(doc, [
        "用户在需求详情点击应聘；未登录则登录后返回。",
        "系统检查应聘者是否有服务档案。",
        "有服务档案时提示发布者可查看；没有时提示通过聊天仔细了解经验。",
        "创建应聘申请及聊天会话，状态为等待回复。",
        "发布者可以确认、拒绝或继续沟通。",
        "只有发布者确认后应聘才成功，需求变为已找到服务者并退出公开列表。",
        "发布者可取消已确认服务者；需求未过期时可重新公开。",
    ])
    add_heading(doc, "10.2 预约服务", 2)
    add_numbered(doc, [
        "用户在服务详情点击预约；未登录则登录后返回。",
        "用户选择预约时间段，页面显示该日期已有成功预约数量。",
        "系统检查服务状态、时间冲突和接待容量。",
        "提交后创建预约申请和聊天会话，状态为等待服务者确认。",
        "服务者可以确认、拒绝或继续沟通。",
        "只有服务者确认后预约才成功，并更新日期容量。",
        "服务者可取消确认，系统保留记录并通知预约用户。",
    ])

    add_heading(doc, "11. 站内消息与邮箱通知", 1)
    add_heading(doc, "11.1 站内消息", 2)
    add_bullets(doc, [
        "会话来源包括需求咨询、需求应聘、服务咨询和服务预约。",
        "支持文本、图片、需求/服务卡片、状态消息、未读数量和会话搜索。",
        "关键状态变化以系统消息写入相关会话。",
    ])
    add_heading(doc, "11.2 发布后的邮箱通知检查", 2)
    add_numbered(doc, [
        "需求或服务发布成功后检查邮箱通知状态。",
        "已经开启时不重复提示，直接进入推荐流程。",
        "未开启时询问是否接受在收到消息后立即发送邮件。",
        "接受时完成邮箱绑定/验证并开启通知；拒绝不影响发布结果。",
    ])
    add_heading(doc, "11.3 邮件发送规则", 2)
    add_bullets(doc, [
        "仅向已验证邮箱且开启通知的用户发送。",
        "覆盖新消息、应聘确认/拒绝、预约确认/拒绝/取消等重要变化。",
        "连续消息采用短时间聚合，避免一条消息一封邮件。",
        "用户可在通知设置中随时关闭。",
    ])

    add_heading(doc, "12. 生命周期与公开规则", 1)
    add_heading(doc, "12.1 需求公开条件", 2)
    add_para(doc, "只有状态为“公开招募中”且未过期的需求，才进入首页、搜索、地图和匹配推荐。")
    add_heading(doc, "12.2 自动过期", 2)
    add_bullets(doc, [
        "超过有效时间后从公开页面移除。",
        "停止新的咨询和应聘，不再参与匹配。",
        "发布者仍可在我的需求查看，收藏者仍可在收藏夹查看。",
        "历史聊天、申请和状态记录继续保留。",
    ])
    add_heading(doc, "12.3 服务公开条件", 2)
    add_para(doc, "服务须处于公开接单状态，服务档案接单模式开启，并满足可用时间与容量条件。暂停、删除或全部关闭的服务不出现在公开列表。")

    add_heading(doc, "13. 匹配与发布后推荐", 1)
    add_heading(doc, "13.1 需求匹配服务", 2)
    add_bullets(doc, ["服务类型", "宠物类型/体型/年龄", "地点与距离", "日期与时间", "任务能力", "预算与货币", "服务容量"])
    add_para(doc, "有高度匹配服务时询问是否查看；没有时推荐能够照护相同宠物、但服务类别可能不同的其他服务。用户拒绝查看时返回我的需求详情。")
    add_heading(doc, "13.2 服务匹配需求", 2)
    add_bullets(doc, ["服务类型", "服务地点和范围", "宠物类型", "日期", "任务", "预算", "服务限制"])
    add_para(doc, "有匹配需求时可查看匹配需求或附近需求；没有完全匹配时询问是否查看附近需求。已过期、已取消或已找到服务者的需求不得推荐。")

    add_heading(doc, "14. 页面结构与跳转关系", 1)
    page_rows = [
        ("首页", "附近需求、附近服务、附近服务者、类型介绍、照护知识", "需求/服务/服务者详情、登录注册"),
        ("需求", "列表、地图、筛选、详情、发布、编辑", "咨询、应聘、收藏、我的需求"),
        ("服务", "服务列表、服务者列表、详情、发布、编辑", "咨询、预约、服务档案、我的服务"),
        ("登录注册", "登录、注册、邮箱验证、找回密码、首次引导", "首次分流、个人中心、原操作回跳"),
        ("消息", "会话列表、聊天详情、状态消息", "相关需求、服务、应聘和预约"),
        ("个人中心", "我的需求、我的服务、应聘预约、收藏、资料、设置", "各业务详情及编辑页面"),
        ("个人资料", "基础资料、宠物档案、地址档案", "需求表单对应步骤"),
        ("服务档案", "经验、默认地点、常用货币、批量管理", "服务表单对应步骤、公开服务"),
        ("内容中心", "三种类型介绍、照护知识分类和外链", "首页和详情辅助入口"),
    ]
    add_table(doc, ["一级页面", "主要内容", "关键去向"], page_rows, [1700, 4300, 3360])
    add_callout(doc, "配套文件", "完整页面跳转与用户行为关系另见《Petnido完整用户操作流程图_v2.0.mmd》。")

    add_heading(doc, "15. 核心数据模型", 1)
    data_rows = [
        ("User / UserProfile", "账号、基础资料、语言、地区和邮箱状态。"),
        ("PetProfile", "可复用宠物档案。"),
        ("AddressProfile", "可复用地址档案和默认地址。"),
        ("ProviderProfile", "服务者介绍、经验、默认地点、服务范围和常用货币。"),
        ("Need / NeedPet / NeedTask", "需求主记录、发布快照、关联宠物和任务。"),
        ("Service / Availability / Capacity", "服务内容、可用时间和容量。"),
        ("Application", "需求应聘、确认、拒绝和取消记录。"),
        ("Booking", "服务预约、时间段、容量和状态记录。"),
        ("Conversation / Message", "业务会话、用户消息和系统状态消息。"),
        ("Favorite", "需求、服务及服务者收藏。"),
        ("NotificationPreference", "邮箱绑定、验证和通知偏好。"),
        ("KnowledgeLink", "照护知识标题、摘要、分类和链接。"),
    ]
    add_table(doc, ["数据对象", "职责"], data_rows, [2800, 6560])
    add_para(doc, "发布内容必须保留独立快照，避免个人档案后续修改影响历史业务记录。", bold_lead="发布内容")

    add_heading(doc, "16. 多语言与多货币", 1)
    add_heading(doc, "16.1 多语言", 2)
    add_para(doc, "第一阶段建议支持简体中文、英文和日文。页面、表单字段、按钮、状态、系统消息和邮件模板全部使用国际化键值管理。用户生成内容和聊天内容暂不自动翻译。")
    add_heading(doc, "16.2 多货币", 2)
    add_bullets(doc, [
        "服务档案保存常用货币，单个服务允许修改。",
        "需求预算明确记录货币。",
        "筛选和匹配同时考虑金额及货币。",
        "第一阶段不强制自动汇率换算，页面始终明确显示货币代码或符号。",
    ])

    add_heading(doc, "17. 非功能要求", 1)
    nfr_rows = [
        ("响应式", "优先适配手机浏览器，同时支持桌面和平板；长表单分步填写并自动保存草稿。"),
        ("性能", "列表分页/范围加载、图片缩略与压缩、消息未读及时更新、过期和公开状态同步。"),
        ("隐私", "公开页不展示精确住址和邮箱；聊天仅双方可见；历史业务保留必要快照。"),
        ("可用性", "档案默认值允许修改；步骤切换不丢数据；发布前预览；状态文案清晰。"),
        ("可靠性", "应聘和预约确认需幂等；容量更新需防止并发超订；邮件发送可重试但不可重复轰炸。"),
        ("可访问性", "表单有明确标签、键盘可操作、状态不只依赖颜色、图片提供替代文本。"),
    ]
    add_table(doc, ["类别", "要求"], nfr_rows, [1800, 7560])

    add_heading(doc, "18. 开发阶段规划", 1)
    roadmap_rows = [
        ("阶段1", "基础框架与账号", "多语言框架、注册登录、首次引导、个人中心、个人/宠物/地址/服务档案。"),
        ("阶段2", "需求系统", "三类需求表单、档案读取/成功后写入、列表筛选、详情收藏、状态及过期。"),
        ("阶段3", "服务系统", "接单模式、三类服务、默认值、单项/批量管理、可用时间与容量。"),
        ("阶段4", "沟通与撮合", "聊天、咨询、应聘、预约、确认/取消、匹配及附近推荐。"),
        ("阶段5", "通知与内容", "邮箱通知引导、邮件发送、类型介绍、照护知识和国际化检查。"),
        ("阶段6", "测试与上线", "功能、状态、档案同步、权限隐私、多语言、移动端、部署和备份。"),
    ]
    add_table(doc, ["阶段", "主题", "主要交付"], roadmap_rows, [1200, 2100, 6060])

    add_heading(doc, "19. 验收标准", 1)
    add_bullets(doc, [
        "游客可浏览公开页面；触发受限操作后登录并返回原操作。",
        "首次注册按选择进入需求或服务流程；非首次登录直接进入个人中心。",
        "需求表单只在宠物/地址步骤读取档案，发布成功后才写入档案。",
        "服务表单只在地点/货币步骤读取服务档案，发布成功后才写入。",
        "需求发布后执行邮箱通知检查，再进行服务推荐；服务发布后同理推荐需求。",
        "应聘和预约在对方确认前均不得显示为成功。",
        "确认服务者后需求退出公开列表；取消确认且未过期时可恢复公开。",
        "服务详情可展示所选日期成功预约数量，并按容量阻止超订。",
        "过期需求不公开、不参与匹配，但个人记录和收藏可查看。",
        "三种语言的页面文案、状态和邮件模板无遗漏。",
    ])

    add_heading(doc, "20. 关键风险与控制", 1)
    risk_rows = [
        ("地址隐私泄露", "高", "公开页只显示模糊区域；精确地址按业务阶段授权展示。"),
        ("档案覆盖历史记录", "高", "需求/服务保存发布快照；发布成功后再更新默认档案。"),
        ("预约容量超订", "高", "提交与确认时双重检查，确认采用事务和幂等控制。"),
        ("状态不一致", "高", "建立显式状态机，所有关键变化写入系统消息与审计记录。"),
        ("邮件过度发送", "中", "验证邮箱、用户开关、消息聚合、退订和频率限制。"),
        ("长表单流失", "中", "分步表单、草稿、档案复用、进度提示和返回不丢数据。"),
        ("跨货币误解", "中", "金额始终携带货币；首期不隐藏换算假设。"),
    ]
    add_table(doc, ["风险", "等级", "控制措施"], risk_rows, [2200, 1100, 6060])

    add_heading(doc, "21. 产品交付物", 1)
    add_bullets(doc, [
        "本项目计划书 V2.0。",
        "完整用户操作流程图 V2.0。",
        "页面信息架构与跳转关系。",
        "需求/服务字段字典与状态机说明。",
        "产品原型和响应式界面设计。",
        "数据模型、接口清单、测试用例及上线清单。",
    ])
    add_callout(doc, "基线确认", "本计划书与完整流程图共同构成当前产品范围基线；后续原型、数据库和开发任务应以二者一致为验收前提。")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.core_properties.title = "Petnido 网站项目计划书 V2.0"
    doc.core_properties.subject = "宠物照护需求与服务撮合平台产品计划"
    doc.core_properties.author = "Petnido Project Team"
    doc.core_properties.keywords = "Petnido, 宠物照护, 项目计划, 产品需求"
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build_document()
