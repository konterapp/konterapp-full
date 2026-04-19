import bwipjs from 'bwip-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ProductBarcodePrintItem } from './admin.service';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_X = 24;
const MARGIN_Y = 24;
const COLUMN_COUNT = 3;
const COLUMN_GAP = 10;
const ROW_GAP = 10;
const LABEL_HEIGHT = 92;
const LABEL_PADDING = 6;
const TITLE_FONT_SIZE = 9;
const META_FONT_SIZE = 8;
const BARCODE_TEXT_SIZE = 10;
const MAX_NAME_LENGTH = 32;

function truncateText(value: string, limit: number) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1)}...`;
}

async function createBarcodePng(barcode: string): Promise<Buffer> {
  return bwipjs.toBuffer({
    bcid: 'code128',
    text: barcode,
    scale: 2,
    height: 12,
    includetext: false,
    paddingwidth: 0,
    paddingheight: 0,
    backgroundcolor: 'FFFFFF',
  });
}

export async function buildProductBarcodePdf(products: ProductBarcodePrintItem[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const labelWidth = (A4_WIDTH - MARGIN_X * 2 - COLUMN_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  let rowIndex = 0;
  let colIndex = 0;

  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    const topY = A4_HEIGHT - MARGIN_Y - rowIndex * (LABEL_HEIGHT + ROW_GAP);
    const bottomY = topY - LABEL_HEIGHT;

    if (bottomY < MARGIN_Y) {
      page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      rowIndex = 0;
      colIndex = 0;
    }

    const currentTop = A4_HEIGHT - MARGIN_Y - rowIndex * (LABEL_HEIGHT + ROW_GAP);
    const x = MARGIN_X + colIndex * (labelWidth + COLUMN_GAP);
    const y = currentTop - LABEL_HEIGHT;

    page.drawRectangle({
      x,
      y,
      width: labelWidth,
      height: LABEL_HEIGHT,
      borderColor: rgb(0.88, 0.88, 0.88),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    const title = truncateText(product.name, MAX_NAME_LENGTH);
    page.drawText(title, {
      x: x + LABEL_PADDING,
      y: y + LABEL_HEIGHT - 14,
      size: TITLE_FONT_SIZE,
      font: fontBold,
      color: rgb(0.11, 0.11, 0.11),
    });

    page.drawText(`Kode: ${product.sku}`, {
      x: x + LABEL_PADDING,
      y: y + LABEL_HEIGHT - 26,
      size: META_FONT_SIZE,
      font: fontRegular,
      color: rgb(0.35, 0.35, 0.35),
    });

    const barcodePng = await createBarcodePng(product.barcode);
    const barcodeImage = await pdfDoc.embedPng(barcodePng);
    const barcodeWidth = labelWidth - LABEL_PADDING * 2;
    const scale = barcodeWidth / barcodeImage.width;
    const barcodeHeight = barcodeImage.height * scale;
    const barcodeY = y + 16;

    page.drawImage(barcodeImage, {
      x: x + LABEL_PADDING,
      y: barcodeY,
      width: barcodeWidth,
      height: barcodeHeight,
    });

    page.drawText(product.barcode, {
      x: x + LABEL_PADDING,
      y: y + 8,
      size: BARCODE_TEXT_SIZE,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    colIndex += 1;
    if (colIndex >= COLUMN_COUNT) {
      colIndex = 0;
      rowIndex += 1;
    }
  }

  return pdfDoc.save();
}
