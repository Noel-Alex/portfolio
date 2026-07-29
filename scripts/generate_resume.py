from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.pdfgen.canvas import Canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "Noel-Alex-Resume.pdf"

INK = HexColor("#162018")
MOSS = HexColor("#4D7B39")
GRASS = HexColor("#78A957")
AMETHYST = HexColor("#765196")
PAPER = HexColor("#F5F2E6")
MUTED = HexColor("#566159")
RULE = HexColor("#C8CEC3")
WHITE = HexColor("#FFFFFF")


def register_fonts() -> tuple[str, str, str]:
    candidates = [
        (
            Path("C:/Windows/Fonts/arial.ttf"),
            Path("C:/Windows/Fonts/arialbd.ttf"),
            Path("C:/Windows/Fonts/consola.ttf"),
        ),
    ]
    for regular, bold, mono in candidates:
        if regular.exists() and bold.exists() and mono.exists():
            pdfmetrics.registerFont(TTFont("ResumeSans", str(regular)))
            pdfmetrics.registerFont(TTFont("ResumeSansBold", str(bold)))
            pdfmetrics.registerFont(TTFont("ResumeMono", str(mono)))
            return "ResumeSans", "ResumeSansBold", "ResumeMono"
    return "Helvetica", "Helvetica-Bold", "Courier"


FONT, FONT_BOLD, FONT_MONO = register_fonts()


def paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def draw_pixel_mark(canvas: Canvas, x: float, y: float, size: float) -> None:
    unit = size / 5
    pixels = {
        (0, 0), (1, 0), (2, 0), (3, 0),
        (0, 1), (3, 1),
        (0, 2), (1, 2), (3, 2), (4, 2),
        (0, 3), (2, 3), (4, 3),
        (0, 4), (3, 4), (4, 4),
    }
    canvas.setFillColor(GRASS)
    for px, py in pixels:
        canvas.rect(x + px * unit, y + (4 - py) * unit, unit, unit, stroke=0, fill=1)


def draw_header(canvas: Canvas, width: float, height: float) -> float:
    canvas.setFillColor(INK)
    canvas.rect(0, height - 42 * mm, width, 42 * mm, stroke=0, fill=1)
    draw_pixel_mark(canvas, 17 * mm, height - 30 * mm, 15 * mm)
    canvas.setFillColor(WHITE)
    canvas.setFont(FONT_BOLD, 23)
    canvas.drawString(39 * mm, height - 20 * mm, "NOEL ALEX")
    canvas.setFillColor(HexColor("#C7E4B4"))
    canvas.setFont(FONT_MONO, 8.6)
    canvas.drawString(39 * mm, height - 27 * mm, "DATA SCIENCE  /  SYSTEMS  /  AI")
    canvas.setFillColor(HexColor("#B8C2BA"))
    canvas.setFont(FONT, 8.4)
    canvas.drawString(39 * mm, height - 34 * mm, "VIT Vellore · graduating 2027 · open to remote opportunities")

    canvas.setFillColor(HexColor("#DDE6DF"))
    canvas.setFont(FONT_MONO, 7.4)
    canvas.drawRightString(width - 17 * mm, height - 18 * mm, "noelalex404@gmail.com")
    canvas.drawRightString(width - 17 * mm, height - 24 * mm, "github.com/Noel-Alex")
    canvas.drawRightString(width - 17 * mm, height - 30 * mm, "linkedin.com/in/noel-alex-b1731128b")
    return height - 49 * mm


def section_label(canvas: Canvas, title: str, x: float, y: float, width: float) -> float:
    canvas.setFillColor(MOSS)
    canvas.setFont(FONT_MONO, 8.2)
    canvas.drawString(x, y, title.upper())
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.7)
    canvas.line(x, y - 2.2 * mm, x + width, y - 2.2 * mm)
    return y - 7 * mm


def draw_bullet(canvas: Canvas, text: str, x: float, y: float, width: float, style: ParagraphStyle) -> float:
    canvas.setFillColor(GRASS)
    canvas.rect(x, y - 2.5, 3.5, 3.5, stroke=0, fill=1)
    p = paragraph(text, style)
    _, h = p.wrap(width - 10, 80 * mm)
    p.drawOn(canvas, x + 9, y - h + 4)
    return y - h - 2.2 * mm


def project_block(canvas: Canvas, title: str, meta: str, body: str, x: float, y: float, width: float, title_style: ParagraphStyle, body_style: ParagraphStyle) -> float:
    title_p = paragraph(f"<b>{title}</b> <font color='#765196'>· {meta}</font>", title_style)
    _, title_h = title_p.wrap(width, 30 * mm)
    title_p.drawOn(canvas, x, y - title_h)
    body_p = paragraph(body, body_style)
    _, body_h = body_p.wrap(width, 50 * mm)
    body_p.drawOn(canvas, x, y - title_h - body_h - 2)
    return y - title_h - body_h - 3.1 * mm


def build_resume() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    width, height = A4
    canvas = Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    canvas.setTitle("Noel Alex — Resume")
    canvas.setAuthor("Noel Alex")
    canvas.setSubject("Data science, systems, AI, and community leadership")
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)

    body = ParagraphStyle("body", fontName=FONT, fontSize=8.2, leading=11.6, textColor=INK)
    small = ParagraphStyle("small", fontName=FONT, fontSize=7.5, leading=10.6, textColor=MUTED)
    project_title = ParagraphStyle("project", fontName=FONT, fontSize=8.5, leading=11.6, textColor=INK)
    right = ParagraphStyle("right", fontName=FONT_MONO, fontSize=7.1, leading=10, textColor=MUTED, alignment=TA_RIGHT)

    margin = 17 * mm
    usable = width - 2 * margin
    y = draw_header(canvas, width, height)

    y = section_label(canvas, "Profile", margin, y, usable)
    profile = paragraph(
        "Data science student who enjoys turning ambiguous, high-volume problems into working systems. "
        "Builds across research tooling, retrieval, distributed infrastructure, and applied AI; leads with curiosity, candour, and a strong bias toward people.",
        body,
    )
    _, ph = profile.wrap(usable, 35 * mm)
    profile.drawOn(canvas, margin, y - ph)
    y -= ph + 5 * mm

    column_gap = 10 * mm
    left_w = 116 * mm
    right_x = margin + left_w + column_gap
    right_w = usable - left_w - column_gap
    left_y = section_label(canvas, "Selected builds", margin, y, left_w)

    left_y = project_block(
        canvas,
        "Stretchy",
        "solo · active",
        "Local-first, evidence-grounded investigation system spanning durable workflows, retrieval, a bounded evidence graph, worker telemetry, and a Rust scanning path. <b>Python, Rust, Temporal, PostgreSQL, Qdrant, FalkorDB.</b>",
        margin,
        left_y,
        left_w,
        project_title,
        small,
    )
    left_y = project_block(
        canvas,
        "Arachne → PhishGuard",
        "solo · research experiment",
        "Built a high-concurrency Rust crawler to collect DOM structure from phishing and legitimate sites, then trained a hybrid graph model using DOM topology and URL features. Held-out phishing metrics: <b>0.99 recall, 0.94 precision</b>; documented the dataset-distribution limitation that restricts real-world generalization.",
        margin,
        left_y,
        left_w,
        project_title,
        small,
    )
    left_y = project_block(
        canvas,
        "UltraChat",
        "GDG VIT · collaborative",
        "Discord knowledge companion for large server histories. Contributed retrieval, vector storage, long-text summarisation, prompt flows, commands, Docker setup, and backend integration. <b>Python, LlamaIndex, LangChain, ChromaDB, Discord API.</b>",
        margin,
        left_y,
        left_w,
        project_title,
        small,
    )
    left_y = project_block(
        canvas,
        "Kargo",
        "GDG VIT · collaborative",
        "Contributed to the repository-inspection path for an AI-assisted deployment platform, including codebase summarisation and extraction of port and persistence signals used during container configuration generation.",
        margin,
        left_y,
        left_w,
        project_title,
        small,
    )

    left_y -= 2 * mm
    left_y = section_label(canvas, "Leadership and community", margin, left_y, left_w)
    left_y = draw_bullet(
        canvas,
        "<b>Senior Core Member, GDG VIT</b> — leads the AI/ML domain in practice; helps plan and run DevJams, Women Techies, and Hexathon across operations, technical work, and judging.",
        margin,
        left_y,
        left_w,
        small,
    )
    left_y = draw_bullet(
        canvas,
        "Helped evaluate a recruitment pool of about <b>5,000</b> applicants and personally assessed roughly <b>256</b> through tests, projects, and interviews.",
        margin,
        left_y,
        left_w,
        small,
    )
    left_y = draw_bullet(
        canvas,
        "Sole speaker and curriculum designer for <b>Inside Google’s DeepMind</b>, a 400+ student session covering transformers and AlphaFold.",
        margin,
        left_y,
        left_w,
        small,
    )

    right_y = section_label(canvas, "Education", right_x, y, right_w)
    edu = paragraph(
        "<b>B.Tech, Computer Science</b><br/>Specialization in Data Science<br/>VIT Vellore<br/><font color='#4D7B39'>Expected 2027</font>",
        body,
    )
    _, eh = edu.wrap(right_w, 42 * mm)
    edu.drawOn(canvas, right_x, right_y - eh)
    right_y -= eh + 7 * mm

    right_y = section_label(canvas, "Toolkit", right_x, right_y, right_w)
    toolkit_rows = [
        ("LANGUAGES", "Python · Rust · TypeScript · Go"),
        ("SYSTEMS", "FastAPI · Temporal · Docker · PostgreSQL"),
        ("RETRIEVAL", "Qdrant · FalkorDB · ChromaDB · LlamaIndex"),
        ("ML", "PyTorch · PyTorch Geometric · Transformers · GNNs"),
        ("WORKING STYLE", "Research · technical writing · leadership · rapid iteration"),
    ]
    table_data = []
    for label, value in toolkit_rows:
        table_data.append([
            paragraph(label, ParagraphStyle("label", parent=small, fontName=FONT_MONO, fontSize=6.7, textColor=MOSS)),
            paragraph(value, small),
        ])
    table = Table(table_data, colWidths=[25 * mm, right_w - 25 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    _, th = table.wrap(right_w, 90 * mm)
    table.drawOn(canvas, right_x, right_y - th)
    right_y -= th + 6 * mm

    right_y = section_label(canvas, "Earlier chapter", right_x, right_y, right_w)
    earlier = paragraph(
        "Built a private Discord bot in Grade 11 while learning Python through experimentation. Friends used its music, games, moderation, and class-reminder tools through remote school.<br/><br/>Served as Head Boy in Riyadh, focused on trust, cooperation, and representing students responsibly.",
        small,
    )
    _, earlier_h = earlier.wrap(right_w, 65 * mm)
    earlier.drawOn(canvas, right_x, right_y - earlier_h)

    canvas.setStrokeColor(RULE)
    canvas.line(margin, 15 * mm, width - margin, 15 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont(FONT_MONO, 6.6)
    canvas.drawString(margin, 10.5 * mm, "SELECTED LINKS")
    links = paragraph(
        "stretchy: noel-alex.github.io/stretchy  ·  talk: youtube.com/watch?v=SGLh-A3z4yI  ·  portfolio: noel-alex.github.io/portfolio",
        right,
    )
    _, lh = links.wrap(usable - 29 * mm, 12 * mm)
    links.drawOn(canvas, margin + 29 * mm, 9.7 * mm)

    canvas.showPage()
    canvas.save()


if __name__ == "__main__":
    build_resume()
    print(OUTPUT)
