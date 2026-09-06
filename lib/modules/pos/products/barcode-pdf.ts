import bwipjs from 'bwip-js/node';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ProductBarcodePrintItem } from './admin.service';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_X = 24;
const MARGIN_Y = 24;
const COLUMN_COUNT = 4;
const COLUMN_GAP = 8;
const ROW_GAP = 8;
const LABEL_HEIGHT = 76;
const LABEL_PADDING = 5;
const TITLE_FONT_SIZE = 8;
const META_FONT_SIZE = 7;
const BARCODE_TEXT_SIZE = 8.5;
const BARCODE_TEXT_GAP = 2;
const MAX_NAME_LENGTH = 28;
const MAX_BARCODE_HEIGHT = 24;
const TITLE_Y_OFFSET = 12;
const CODE_Y_OFFSET = 20;
const BARCODE_TOP_OFFSET = 23;

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
    const titleWidth = fontBold.widthOfTextAtSize(title, TITLE_FONT_SIZE);
    const titleX = x + (labelWidth - titleWidth) / 2;
    page.drawText(title, {
      x: titleX,
      y: y + LABEL_HEIGHT - TITLE_Y_OFFSET,
      size: TITLE_FONT_SIZE,
      font: fontBold,
      color: rgb(0.11, 0.11, 0.11),
    });

    const codeText = `Kode: ${product.sku}`;
    const codeWidth = fontRegular.widthOfTextAtSize(codeText, META_FONT_SIZE);
    const codeX = x + (labelWidth - codeWidth) / 2;
    page.drawText(codeText, {
      x: codeX,
      y: y + LABEL_HEIGHT - CODE_Y_OFFSET,
      size: META_FONT_SIZE,
      font: fontRegular,
      color: rgb(0.35, 0.35, 0.35),
    });

    const barcodePng = await createBarcodePng(product.barcode);
    const barcodeImage = await pdfDoc.embedPng(barcodePng);
    const maxBarcodeWidth = labelWidth - LABEL_PADDING * 2;
    const widthScale = maxBarcodeWidth / barcodeImage.width;
    const heightScale = MAX_BARCODE_HEIGHT / barcodeImage.height;
    const scale = Math.min(widthScale, heightScale);
    const barcodeWidth = barcodeImage.width * scale;
    const barcodeHeight = barcodeImage.height * scale;
    const barcodeX = x + (labelWidth - barcodeWidth) / 2;
    const barcodeTopY = y + LABEL_HEIGHT - BARCODE_TOP_OFFSET;
    const barcodeY = barcodeTopY - barcodeHeight;

    page.drawImage(barcodeImage, {
      x: barcodeX,
      y: barcodeY,
      width: barcodeWidth,
      height: barcodeHeight,
    });

    const barcodeTextWidth = fontBold.widthOfTextAtSize(product.barcode, BARCODE_TEXT_SIZE);
    const barcodeTextX = barcodeX + (barcodeWidth - barcodeTextWidth) / 2;
    // Keep human-readable barcode text close to bars, but still inside the label box.
    const barcodeTextY = Math.max(y + 3, barcodeY - BARCODE_TEXT_SIZE - BARCODE_TEXT_GAP);
    page.drawText(product.barcode, {
      x: barcodeTextX,
      y: barcodeTextY,
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
