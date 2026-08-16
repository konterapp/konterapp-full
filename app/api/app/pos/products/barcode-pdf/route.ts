import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { bulkProductBarcodePdfSchema } from '@/lib/validations/product';
import { posProductService } from '@/lib/modules/pos/products/admin.service';
import { buildProductBarcodePdf } from '@/lib/modules/pos/products/barcode-pdf';

export const POST = withPermission(
  'pos.product.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const body = await req.json();
    const result = validateSchema(bulkProductBarcodePdfSchema, body);
    if (!('data' in result)) return result;

    const products = await posProductService.getProductsForBarcodePdf(result.data.uuids);
    const pdfBytes = await buildProductBarcodePdf(products);
    const pdfArrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(pdfArrayBuffer).set(pdfBytes);
    const filename = `barcode-produk-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.length),
      },
    });
  })
);
