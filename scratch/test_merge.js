const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function testMerge() {
  try {
    const watermarkPath = path.join(__dirname, '..', 'docs', 'marca agua.pdf');
    if (!fs.existsSync(watermarkPath)) {
      console.error("No existe marca agua.pdf en", watermarkPath);
      return;
    }

    const watermarkBytes = fs.readFileSync(watermarkPath);
    const watermarkDoc = await PDFDocument.load(watermarkBytes);
    
    // Crear un PDF de prueba simple
    const testDoc = await PDFDocument.create();
    const page = testDoc.addPage([841.92, 595.32]);
    page.drawText("Hola Mundo - Prueba de PDF con marca de agua", { x: 50, y: 300, size: 20 });
    const testPdfBytes = await testDoc.save();

    // Fusión
    const finalDoc = await PDFDocument.create();
    const tempDoc = await PDFDocument.load(testPdfBytes);
    
    const [embeddedWatermark] = await finalDoc.embedPdf(watermarkDoc, [0]);
    const tempPages = await finalDoc.embedPages(tempDoc.getPages());

    for (let i = 0; i < tempPages.length; i++) {
      const newPage = finalDoc.addPage([841.92, 595.32]);
      
      // Dibujar marca de agua primero (fondo)
      newPage.drawPage(embeddedWatermark, {
        x: 0,
        y: 0,
        width: 841.92,
        height: 595.32,
      });

      // Dibujar la página de contenido encima
      newPage.drawPage(tempPages[i], {
        x: 0,
        y: 0,
        width: 841.92,
        height: 595.32,
      });
    }

    const finalBytes = await finalDoc.save();
    fs.writeFileSync(path.join(__dirname, 'test_output.pdf'), finalBytes);
    console.log("PDF de prueba generado con éxito en scratch/test_output.pdf");
  } catch (error) {
    console.error("Error fusionando PDFs:", error);
  }
}

testMerge();
