<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sales Invoice - {{ $salesInvoice->code }}</title>
    <style>
        @page {
            size: 21cm 14cm; /* Sesuaikan dengan setting printer Anda */
            margin: 10mm 5mm 5mm 5mm;
        }
        body {
            font-family: "Courier New", monospace;
            font-size: 10pt;
            line-height: 1.2;
            position: relative;
            margin: 0;
            padding: 0;
            font-weight: bold;
        }

        /* Footer tanpa position fixed */
        .footer {
            width: 100%;
            border-top: 1px solid #000;
            padding-top: 1mm;
            font-size: 9pt;
            color: #000;
            text-align: center;
            background-color: white;
            height: 4mm;
            font-weight: bold;
            margin-top: 2mm;
        }

        .header {
            text-align: center;
            margin-bottom: 1mm;
        }
        .invoice-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 2mm;
            text-decoration: underline;
        }
        .invoice-number {
            margin-bottom: 2mm;
            font-size: 12pt;
            font-weight: bold;
        }
        .header-note {
            font-style: italic;
            margin-bottom: 5mm;
            font-size: 10pt;
            font-weight: bold;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1mm;
        }
        table, th, td {
            border: 2px solid black;
        }
        th, td {
            padding: 1mm;
            text-align: left;
            font-size: 10pt;
            font-weight: bold;
        }

        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }

        .notes-title {
            font-weight: bold;
            margin-bottom: 0.5mm;
        }

        .summary-table td {
            padding: 1mm;
            font-size: 11pt;
            font-weight: bold;
        }
        .summary-table .label {
            font-weight: normal;
            text-align: right;
        }
        .summary-table .value {
            font-weight: bold;
            text-align: right;
            width: 45%;
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
            margin-top: 1mm;
            text-align: center;
            clear: both;
            page-break-inside: avoid;
        }
        .signature-block {
            display: inline-block;
            margin: 0 8mm;
            text-align: center;
            vertical-align: top;
            font-size: 8pt;
            font-weight: bold;
        }

        .waybill-detail {
            margin-bottom: 1mm;
            margin-top: 4mm;
            page-break-inside: avoid;
        }
        .waybill-header {
            background-color: #f5f5f5;
            padding: 1mm;
            margin-bottom: 0.5mm;
            font-weight: bold;
            font-size: 10pt;
            border: 2px solid black;
        }

        .item-table th {
            background-color: #f9f9f9;
            font-size: 9pt;
            font-weight: bold;
            border: 2px solid black;
            padding: 0.8mm;
        }
        .item-table td {
            font-size: 8pt;
            font-weight: bold;
            border: 2px solid black;
            padding: 0.8mm;
        }
        .item-subtotal {
            background-color: #f9f9f9;
            font-weight: bold;
        }

        .content-wrapper {
            position: relative;
            z-index: 10;
            max-width: 100%;
        }

        /* 3 Grid Layout - KEMBALI KE FLOAT untuk menjaga alignment */
        .three-column {
            width: 100%;
            margin-bottom: 1mm;
            overflow: hidden; /* Clearfix */
        }
        .three-column .col {
            width: 32%;
            float: left;
            padding: 0 1mm;
            vertical-align: top;
            font-size: 8pt;
            font-weight: bold;
        }
        .three-column .col:first-child {
            padding-left: 0;
        }
        .three-column .col:last-child {
            padding-right: 0;
        }

        /* Info content */
        .info-content {
            line-height: 1.1;
        }
        .info-content .label {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 0.5mm;
            display: block;
            font-size: 9pt;
        }
        .info-content .detail {
            font-size: 8pt;
            margin-bottom: 0.3mm;
        }

        /* Compact spacing */
        .compact-spacing {
            margin-bottom: 0.5mm;
        }

        /* Watermark yang muncul di setiap halaman continuous paper */
        .watermark {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            z-index: -1000;
            pointer-events: none;
        }

        .watermark::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 300%;
            background-image: url('data:image/png;base64,{{ base64_encode(file_get_contents(public_path("business-logo.png"))) }}');
            background-repeat: repeat-y;
            background-position: center;
            background-size: 150px 150px;
            opacity: 0.06;
            z-index: -1;
        }

        .page-watermark {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('data:image/png;base64,{{ base64_encode(file_get_contents(public_path("business-logo.png"))) }}');
            background-repeat: no-repeat;
            background-position: center center;
            background-size: 120px 120px;
            opacity: 0.08;
            z-index: -1;
            pointer-events: none;
        }

        .waybill-detail {
            position: relative;
        }

        .waybill-detail::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('data:image/png;base64,{{ base64_encode(file_get_contents(public_path("business-logo.png"))) }}');
            background-repeat: no-repeat;
            background-position: center center;
            background-size: 100px 100px;
            opacity: 0.04;
            z-index: -1;
            pointer-events: none;
        }

        /* Two column untuk bagian bawah - KEMBALI KE FLOAT */
        .two-column {
            width: 100%;
            overflow: hidden; /* Clearfix */
        }
        .two-column .left-col {
            width: 48%;
            float: left;
            padding-right: 1mm;
        }
        .two-column .right-col {
            width: 48%;
            float: right;
            padding-left: 1mm;
        }

        /* Clear float helper */
        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }

        /* Print optimizations */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .content-wrapper {
                overflow: visible;
            }

            .waybill-detail {
                page-break-inside: avoid;
            }

            .signatures {
                page-break-inside: avoid;
            }

            /* Pastikan footer tidak overlap */
            .footer {
                page-break-inside: avoid;
                margin-top: 5mm;
            }
        }
    </style>
</head>
<body>
<div class="watermark"></div>

<div class="content-wrapper">
    <div class="page-watermark"></div>

    <div class="header">
        <div class="invoice-title">SALES INVOICE</div>
        <div class="invoice-number">{{ $salesInvoice->code }}</div>
        <div class="header-note">OFFICIAL INVOICE DOCUMENT</div>
    </div>

    <div class="three-column compact-spacing clearfix">
        <!-- Column 1: From -->
        <div class="col">
            <div class="info-content">
                <div class="label">From</div>
                <div class="detail">Alta Interior</div>
                <div class="detail">Jln. Tawang - Cawas No. 03, Tawang Rejo, Ngreco, Weru, Sukoharjo</div>
                <div class="detail">Phone: 085741601168</div>
                <div class="detail">Branch: {{ $salesInvoice->branch ? $salesInvoice->branch->name : 'Main Branch' }}</div>
            </div>
        </div>

        <!-- Column 2: Bill To -->
        <div class="col">
            <div class="info-content">
                <div class="label">Bill To</div>
                @if($salesInvoice->customer)
                    <div class="detail">{{ $salesInvoice->customer->name }}</div>
                    <div class="detail">{{ $salesInvoice->customer->address ?? 'Customer address' }}</div>
                    <div class="detail">Phone: {{ $salesInvoice->customer->phone ?? '-' }}</div>
                    <div class="detail">Contact: {{ $salesInvoice->customer->contact_name ?? '-' }}</div>
                @else
                    <div class="detail">{{ $salesInvoice->customer_name }}</div>
                    <div class="detail">Customer details not available</div>
                @endif
            </div>
        </div>

        <!-- Column 3: Invoice Details + Payment Information -->
        <div class="col">
            <div class="info-content">
                <div class="label">Invoice & Payment</div>
                <div class="detail">Date: {{ date('d M Y', strtotime($salesInvoice->date)) }}</div>
                <div class="detail">Due: {{ date('d M Y', strtotime($salesInvoice->due_date)) }}</div>
                <div class="detail" style="margin-top: 1mm;">
                    Payment:
                    @if($salesInvoice->paymentMethod != "Cash")
                        {{ $salesInvoice->paymentMethod->name }}
                    @elseif($salesInvoice->paymnetMethod == "Cash")
                        Cash
                    @else
                        Not specified
                    @endif
                </div>
                @if($salesInvoice->paymentMethod != "Cash" && $salesInvoice->paymentMethod && $salesInvoice->paymentMethod->account_number)
                    <div class="detail">Acc: {{ $salesInvoice->paymentMethod->account_number }}</div>
                @endif
            </div>
        </div>
    </div>

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
                    WB #{{ $index + 1 }}: {{ $detail->waybill ? $detail->waybill->code : 'N/A' }} -
                    {{ $detail->waybill ? date('d M Y', strtotime($detail->waybill->date)) : 'N/A' }} -
                    SO: {{ $detail->waybill && $detail->waybill->salesOrder ? $detail->waybill->salesOrder->code : 'N/A' }}
                </div>

                @if($hasDetails)
                    <table class="item-table">
                        <thead>
                        <tr>
                            <th class="text-center" style="width: 3%;">No</th>
                            <th style="width: 30%;">Item</th>
                            <th style="width: 10%;">Location</th>
                            <th class="text-center" style="width: 7%;">Qty</th>
                            <th class="text-center" style="width: 5%;">Unit</th>
                            <th class="text-center" style="width: 20%;">Unit Price</th>
                            <th class="text-center" style="width: 25%;">Total</th>
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
                                <td>{{ $itemName }}<br><small>({{ $itemCode }})</small></td>
                                <td>{{ $location ?: 'N/A' }}</td>
                                <td class="text-center">
                                    {{ $quantity == floor($quantity) ? number_format($quantity, 0, ',', '.') : number_format($quantity, 2, ',', '.') }}
                                </td>
                                <td class="text-center">{{ $unit ?: '-' }}</td>
                                <td class="text-right">Rp {{ number_format($unitPrice, 0, ',', '.') }}</td>
                                <td class="text-right">Rp {{ number_format($total, 0, ',', '.') }}</td>
                            </tr>
                        @endforeach
                        <tr class="item-subtotal">
                            <td colspan="6" class="text-right"><strong>Waybill Subtotal:</strong></td>
                            <td class="text-right"><strong>Rp {{ number_format($waybillAmount, 0, ',', '.') }}</strong></td>
                        </tr>
                        </tbody>
                    </table>
                @else
                    <div class="text-center" style="padding: 2mm; border: 2px solid black; font-size: 8pt; font-weight: bold;">
                        No items found in this waybill
                    </div>
                @endif
            </div>
        @endforeach
    @else
        <div class="text-center" style="padding: 3mm; border: 1px solid black; margin-bottom: 2mm;">
            No waybills found for this invoice
        </div>
    @endif

    <div class="two-column clearfix">
        <div class="left-col">
            <table style="width: 100%; border: 2px solid black; margin-bottom: 1mm;">
                <tr>
                    <td style="vertical-align: top; padding: 1.5mm; font-size: 8pt; font-weight: bold;">
                        <div class="notes-title">Catatan:</div>
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
                            Pembayaran jatuh tempo dalam {{ $daysUntilDue }} hari dari tanggal invoice. Mohon cantumkan nomor invoice saat melakukan pembayaran.
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="right-col">
            <table class="summary-table no-border">
                <tr>
                    <td class="label">Subtotal:</td>
                    <td class="value">Rp {{ number_format((float)$salesInvoice->total_amount, 0, ',', '.') }}</td>
                </tr>
                @if((float)$salesInvoice->discount_amount > 0)
                    <tr>
                        <td class="label">
                            Discount
                            @if($salesInvoice->discount_type === 'percentage')
                                ({{ number_format((float)$salesInvoice->discount_percentage, 0, ',', '.') }}%)
                            @endif
                        </td>
                        <td class="value" style="color: #e53e3e;">-Rp {{ number_format((float)$salesInvoice->discount_amount, 0, ',', '.') }}</td>
                    </tr>
                @endif
                @if((float)$salesInvoice->tax_amount > 0 && $salesInvoice->taxRate)
                    <tr>
                        <td class="label">Tax ({{ number_format((float)$salesInvoice->taxRate->rate, 0, ',', '.') }}%):</td>
                        <td class="value">Rp {{ number_format((float)$salesInvoice->tax_amount, 0, ',', '.') }}</td>
                    </tr>
                @endif
                <tr class="grand-total">
                    <td class="label" style="border-top: 1px solid #ddd; padding-top: 1mm;"><strong>Grand Total:</strong></td>
                    <td class="value" style="border-top: 1px solid #ddd; padding-top: 1mm;"><strong>Rp {{ number_format((float)$salesInvoice->grand_total, 0, ',', '.') }}</strong></td>
                </tr>
            </table>
        </div>
    </div>

    <div class="signatures">
        <div class="signature-block">
            <div>Prepared By</div>
            <div style="margin-top: 8mm;">___________________</div>
            <div>{{ $salesInvoice->user ? $salesInvoice->user->name : 'Admin' }}</div>
        </div>
        <div class="signature-block">
            <div>Approved By</div>
            <div style="margin-top: 8mm;">___________________</div>
            <div>&nbsp;</div>
        </div>
    </div>
</div>

{{--<div class="footer">--}}
{{--    Alta Interior - Official Invoice Document--}}
{{--</div>--}}

</body>
</html>
