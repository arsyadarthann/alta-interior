<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sales Invoice - {{ $salesInvoice->code }}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
            margin-bottom: 25mm; /* Berikan ruang lebih di bagian bawah untuk footer */
        }
        body {
            font-family: sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            position: relative;
            min-height: 100%;
        }
        /* Perbaikan pada CSS footer untuk mendukung multi-page */
        .footer {
            position: fixed;
            bottom: -15mm; /* Posisi di luar area margin halaman */
            left: 0;
            right: 0;
            width: 100%;
            border-top: 1px solid #ddd;
            padding-top: 2mm;
            font-size: 8pt;
            color: #777;
            text-align: center;
            background-color: white;
            height: 10mm; /* Tentukan tinggi footer */
            z-index: 1000;
        }
        .header {
            text-align: center;
            margin-bottom: 10mm;
        }
        .invoice-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 5mm;
        }
        .invoice-number {
            margin-bottom: 5mm;
        }
        .header-note {
            font-style: italic;
            margin-bottom: 5mm;
        }
        .company-label {
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5mm;
        }
        table, th, td {
            border: 1px solid black;
        }
        th, td {
            padding: 2mm;
            text-align: left;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .notes-title {
            font-weight: bold;
            margin-bottom: 2mm;
        }
        .summary-table td {
            padding: 1mm 2mm;
        }
        .summary-table .label {
            font-weight: normal;
            text-align: right;
        }
        .summary-table .value {
            font-weight: bold;
            text-align: right;
            width: 50%;
        }
        .grand-total {
            background-color: #f8f8f8;
        }
        .no-border {
            border: none;
        }
        table.no-border, table.no-border td, table.no-border th {
            border: none;
        }
        .signatures {
            margin-top: 3mm;
            text-align: center;
            clear: both;
            page-break-inside: avoid;
        }
        .signature-block {
            display: inline-block;
            margin: 0 20mm;
            text-align: center;
            vertical-align: top;
        }
        .waybill-detail {
            margin-bottom: 5mm;
            margin-top: 2mm;
            page-break-inside: avoid;
        }
        .waybill-header {
            background-color: #f5f5f5;
            padding: 2mm;
            margin-bottom: 1mm;
            font-weight: bold;
        }
        .item-table th {
            background-color: #f9f9f9;
            font-size: 9pt;
        }
        .item-table td {
            font-size: 9pt;
        }
        .item-subtotal {
            background-color: #f9f9f9;
            font-weight: bold;
        }

        .content-wrapper {
            position: relative;
            z-index: 10;
        }
    </style>
</head>
<body>
<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1000;">
    <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('business-logo.png'))) }}"
         style="position: absolute; top: 50%; left: 50%; margin-left: -35%; margin-top: -35%; width: 70%; opacity: 0.2;">
</div>

<div class="content-wrapper">
    <div class="header">
        <div class="invoice-title">SALES INVOICE</div>
        <div class="invoice-number">Invoice No : {{ $salesInvoice->code }}</div>
        <div class="header-note">OFFICIAL INVOICE DOCUMENT</div>
    </div>

    <table class="no-border" style="margin-bottom: 5mm;">
        <tr>
            <td style="width: 48%; vertical-align: top;">
                <div class="company-label">From</div>
                <div>Alta Interior</div>
                <div>Jl. Cawas - Tawang No. 3, Ngreco, Weru, Sukoharjo</div>
                <div>Phone/Fax: 085741601168</div>
                <div>Branch: {{ $salesInvoice->branch ? $salesInvoice->branch->name : 'Main Branch' }}</div>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%; vertical-align: top;">
                <div class="company-label">Bill To</div>
                @if($salesInvoice->customer)
                    <div>{{ $salesInvoice->customer->name }}</div>
                    <div>{{ $salesInvoice->customer->address ?? 'Customer address' }}</div>
                    <div>Phone: {{ $salesInvoice->customer->phone ?? '-' }}</div>
                    <div>Contact: {{ $salesInvoice->customer->contact_name ?? '-' }}</div>
                @else
                    <div>{{ $salesInvoice->customer_name }}</div>
                    <div>Customer details not available</div>
                @endif
            </td>
        </tr>
    </table>

    <table class="no-border" style="margin-bottom: 5mm;">
        <tr>
            <td style="width: 48%; vertical-align: top; border: 1px solid black; padding: 3mm;">
                <div class="company-label">Invoice Details</div>
                <div>Invoice Date: {{ date('d M Y', strtotime($salesInvoice->date)) }}</div>
                <div>Due Date: {{ date('d M Y', strtotime($salesInvoice->due_date)) }}</div>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%; vertical-align: top; border: 1px solid black; padding: 3mm;">
                <div class="company-label">Payment Information</div>
                <div>Bank: BCA</div>
                <div>Account Number: 1234567890</div>
                <div>Account Name: PT Alta Interior</div>
            </td>
        </tr>
    </table>

    <!-- Waybill list with detailed items -->
    @if($salesInvoice->salesInvoiceDetails && count($salesInvoice->salesInvoiceDetails) > 0)
        @foreach($salesInvoice->salesInvoiceDetails as $index => $detail)
            @php
                $waybillAmount = 0;
                $hasDetails = false;

                if($detail->waybill && $detail->waybill->waybillDetails && count($detail->waybill->waybillDetails) > 0) {
                    $hasDetails = true;
                }
            @endphp

            <div class="waybill-detail">
                <div class="waybill-header">
                    Waybill #{{ $index + 1 }}: {{ $detail->waybill ? $detail->waybill->code : 'N/A' }} -
                    {{ $detail->waybill ? date('d M Y', strtotime($detail->waybill->date)) : 'N/A' }} -
                    SO: {{ $detail->waybill && $detail->waybill->salesOrder ? $detail->waybill->salesOrder->code : 'N/A' }}
                </div>

                @if($hasDetails)
                    <table class="item-table">
                        <thead>
                        <tr>
                            <th class="text-center" style="width: 3%;">No</th>
                            <th style="width: 30%;">Item</th>
                            <th style="width: 15%;">Item Location</th>
                            <th class="text-center" style="width: 10%;">Quantity</th>
                            <th class="text-center" style="width: 6%;">Unit</th>
                            <th class="text-center" style="width: 16%;">Unit Price</th>
                            <th class="text-center" style="width: 20%;">Total</th>
                        </tr>
                        </thead>
                        <tbody>
                        @foreach($detail->waybill->waybillDetails as $itemIndex => $waybillDetail)
                            @php
                                $quantity = (float)$waybillDetail->quantity;
                                $unitPrice = 0;
                                $total = 0;
                                $unit = '';
                                $itemName = '';
                                $itemCode = '';
                                $location = '';

                                if($waybillDetail->salesOrderDetail) {
                                    $unitPrice = (float)$waybillDetail->salesOrderDetail->unit_price;
                                    $total = $quantity * $unitPrice;
                                    $waybillAmount += $total;

                                    if($waybillDetail->salesOrderDetail->item) {
                                        $itemName = $waybillDetail->salesOrderDetail->item->name;
                                        $itemCode = $waybillDetail->salesOrderDetail->item->code;

                                        if($waybillDetail->salesOrderDetail->item->itemUnit) {
                                            $unit = $waybillDetail->salesOrderDetail->item->itemUnit->abbreviation;
                                        }
                                    }

                                    if($waybillDetail->salesOrderDetail->item_source_able) {
                                        $location = $waybillDetail->salesOrderDetail->item_source_able->name;
                                    }
                                }
                            @endphp
                            <tr>
                                <td class="text-center">{{ $itemIndex + 1 }}</td>
                                <td>{{ $itemName }} ({{ $itemCode }})</td>
                                <td>{{ $location ?: 'N/A' }}</td>
                                <td class="text-center">
                                    {{ $quantity == floor($quantity) ? number_format($quantity, 0, ',', '.') : number_format($quantity, 2, ',', '.') }}
                                </td>
                                <td class="text-center">{{ $unit ?: '-' }}</td>
                                <td class="text-right">Rp {{ number_format($unitPrice, 2, ',', '.') }}</td>
                                <td class="text-right">Rp {{ number_format($total, 2, ',', '.') }}</td>
                            </tr>
                        @endforeach
                        <tr class="item-subtotal">
                            <td colspan="6" class="text-right">Waybill Subtotal:</td>
                            <td class="text-right">Rp {{ number_format($waybillAmount, 2, ',', '.') }}</td>
                        </tr>
                        </tbody>
                    </table>
                @else
                    <div class="text-center" style="padding: 5mm; border: 1px solid black;">
                        No items found in this waybill
                    </div>
                @endif
            </div>
        @endforeach
    @else
        <div class="text-center" style="padding: 10mm; border: 1px solid black; margin-bottom: 10mm;">
            No waybills found for this invoice
        </div>
    @endif

    <div style="width: 100%;">
        <div style="width: 50%; float: left; padding-right: 5mm;">
            <table style="width: 100%; border: 1px solid black; margin-bottom: 5mm;">
                <tr>
                    <td style="vertical-align: top; padding: 3mm;">
                        <div class="notes-title">Notes:</div>
                        <div>
                            @php
                                try {
                                    $invoiceDate = new DateTime($salesInvoice->date);
                                    $dueDate = new DateTime($salesInvoice->due_date);
                                    $interval = $invoiceDate->diff($dueDate);
                                    $daysUntilDue = $interval->days;
                                } catch (Exception $e) {
                                    $daysUntilDue = 30;
                                }
                            @endphp
                            Payment due within {{ $daysUntilDue }} days from invoice date. Please include invoice number when making payment.
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <div style="width: 50%; float: right;">
            <table class="summary-table no-border">
                <tr>
                    <td class="label">Subtotal:</td>
                    <td class="value">Rp {{ number_format((float)$salesInvoice->total_amount, 2, ',', '.') }}</td>
                </tr>
                @if((float)$salesInvoice->discount_amount > 0)
                    <tr>
                        <td class="label">
                            Discount
                            @if($salesInvoice->discount_type === 'percentage')
                                ({{ number_format((float)$salesInvoice->discount_percentage, 0, ',', '.') }}%)
                            @endif
                        </td>
                        <td class="value" style="color: #e53e3e;">-Rp {{ number_format((float)$salesInvoice->discount_amount, 2, ',', '.') }}</td>
                    </tr>
                @endif
                @if((float)$salesInvoice->tax_amount > 0 && $salesInvoice->taxRate)
                    <tr>
                        <td class="label">Tax ({{ number_format((float)$salesInvoice->taxRate->rate, 0, ',', '.') }}%):</td>
                        <td class="value">Rp {{ number_format((float)$salesInvoice->tax_amount, 2, ',', '.') }}</td>
                    </tr>
                @endif
                <tr class="grand-total">
                    <td class="label" style="border-top: 1px solid #ddd; padding-top: 3mm;"><strong>Grand Total:</strong></td>
                    <td class="value" style="border-top: 1px solid #ddd; padding-top: 3mm;">Rp {{ number_format((float)$salesInvoice->grand_total, 2, ',', '.') }}</td>
                </tr>
            </table>
        </div>
    </div>

    <div style="clear: both;"></div>

    <div class="signatures">
        <div class="signature-block">
            <div>Prepared By</div>
            <div style="margin-top: 15mm;">___________________</div>
            <div>{{ $salesInvoice->user ? $salesInvoice->user->name : 'Admin' }}</div>
        </div>
        <div class="signature-block">
            <div>Approved By</div>
            <div style="margin-top: 15mm;">___________________</div>
            <div>&nbsp;</div>
        </div>
    </div>
</div>

<script type="text/php">
    if (isset($pdf)) {
        $pdf->page_script('
            $font = $fontMetrics->get_font("sans-serif", "normal");
            $date = "' . date('d M Y') . '";
            $time = "' . date('H:i') . '";
            $user = "' . (auth()->user() ? auth()->user()->name : 'System') . '";

            $footerText = "This document was printed on $date at $time by $user - Page $PAGE_NUM of $PAGE_COUNT";

            $textWidth = $fontMetrics->get_text_width($footerText, $font, 8);
            $pageWidth = $pdf->get_width();
            $x = ($pageWidth - $textWidth) / 2;

            $pdf->line(30, 770, $pageWidth - 30, 770, array(0, 0, 0), 0.5);

            $pdf->text($x, 780, $footerText, $font, 8);
        ');
    }
</script>


</body>
</html>
