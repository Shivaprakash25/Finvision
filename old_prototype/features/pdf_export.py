
from fpdf import FPDF

def export(df,username):

    pdf=FPDF()
    pdf.add_page()
    pdf.set_font("Arial",size=12)

    pdf.cell(200,10,txt=f"Expense Report - {username}",ln=True)

    for i,row in df.iterrows():
        pdf.cell(200,8,txt=str(list(row)),ln=True)

    path="report.pdf"
    pdf.output(path)
    return path
