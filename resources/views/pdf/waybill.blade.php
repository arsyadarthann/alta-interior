<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Waybill - {{ $waybill->code }}</title>
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
        .waybill-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 2mm;
            text-decoration: underline;
        }
        .waybill-number {
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

        .item-detail {
            margin-bottom: 1mm;
            margin-top: 4mm;
            page-break-inside: avoid;
        }
        .item-header {
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

        .item-detail {
            position: relative;
        }

        .item-detail::before {
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

            .item-detail {
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
        <div class="waybill-title">WAYBILL</div>
        <div class="waybill-number">{{ $waybill->code }}</div>
        <div class="header-note">DELIVERY CONFIRMATION DOCUMENT</div>
    </div>

    <div class="three-column compact-spacing clearfix">
        <!-- Column 1: From -->
        <div class="col">
            <div class="info-content">
                <div class="label">From</div>
                <div class="detail">Alta Interior</div>
                <div class="detail">Jln. Tawang - Cawas No. 03, Tawang Rejo, Ngreco, Weru, Sukoharjo</div>
                <div class="detail">Phone: 085741601168</div>
                <div class="detail">Branch: {{ $waybill->branch ? $waybill->branch->name : 'Main Branch' }}</div>
            </div>
        </div>

        <!-- Column 2: Deliver To -->
        <div class="col">
            <div class="info-content">
                <div class="label">Deliver To</div>
                @if($waybill->salesOrder && $waybill->salesOrder->customer)
                    <div class="detail">{{ $waybill->salesOrder->customer->name }}</div>
                    <div class="detail">{{ $waybill->salesOrder->customer->address ?? 'Customer address' }}</div>
                    <div class="detail">Phone: {{ $waybill->salesOrder->customer->phone ?? '-' }}</div>
                    <div class="detail">Contact: {{ $waybill->salesOrder->customer->contact_name ?? '-' }}</div>
                @else
                    <div class="detail">{{ $waybill->salesOrder->customer_name ?? 'Customer name not provided' }}</div>
                    <div class="detail">Customer details not available</div>
                @endif
            </div>
        </div>

        <!-- Column 3: Waybill Details -->
        <div class="col">
            <div class="info-content">
                <div class="label">Waybill & SO Details</div>
                <div class="detail">Date: {{ date('d M Y', strtotime($waybill->date)) }}</div>
                <div class="detail">Status: {{ ucfirst(str_replace('_', ' ', $waybill->status)) }}</div>
                <div class="detail" style="margin-top: 1mm;">
                    SO: {{ $waybill->salesOrder ? $waybill->salesOrder->code : 'N/A' }}
                </div>
                <div class="detail">SO Date: {{ $waybill->salesOrder ? date('d M Y', strtotime($waybill->salesOrder->date)) : 'N/A' }}</div>
            </div>
        </div>
    </div>

    <!-- Items list -->
    @if($waybill->waybillDetails && count($waybill->waybillDetails) > 0)
        <div class="item-detail">
            <div class="item-header">
                DELIVERY ITEMS
            </div>

            <table class="item-table">
                <thead>
                <tr>
                    <th class="text-center" style="width: 4%;">No</th>
                    <th style="width: 35%;">Item Description</th>
                    <th style="width: 15%;">Item Location</th>
                    <th class="text-center" style="width: 8%;">Qty</th>
                    <th class="text-center" style="width: 6%;">UOM</th>
                    <th style="width: 32%;">Description/Notes</th>
                </tr>
                </thead>
                <tbody>
                @foreach($waybill->waybillDetails as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>
                            @if($item->salesOrderDetail && $item->salesOrderDetail->item)
                                {{ $item->salesOrderDetail->item->name }}<br>
                                <small>({{ $item->salesOrderDetail->item->code }})</small>
                            @else
                                Item details not available
                            @endif
                        </td>
                        <td>
                            @if($item->salesOrderDetail && $item->salesOrderDetail->item_source_able)
                                {{ $item->salesOrderDetail->item_source_able->name }}
                            @else
                                N/A
                            @endif
                        </td>
                        <td class="text-center">
                            {{ $item->quantity == floor($item->quantity) ? number_format($item->quantity, 0, ',', '.') : number_format($item->quantity, 2, ',', '.') }}
                        </td>
                        <td class="text-center">
                            @if($item->salesOrderDetail && $item->salesOrderDetail->item && $item->salesOrderDetail->item->itemUnit)
                                {{ $item->salesOrderDetail->item->itemUnit->abbreviation }}
                            @else
                                -
                            @endif
                        </td>
                        <td>{{ $item->description ?? '-' }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @else
        <div class="text-center" style="padding: 3mm; border: 2px solid black; margin-bottom: 2mm; font-weight: bold;">
            No items found in this waybill
        </div>
    @endif

    <div class="two-column clearfix">
        <div class="left-col">
            <table style="width: 100%; border: 2px solid black; margin-bottom: 1mm;">
                <tr>
                    <td style="vertical-align: top; padding: 1.5mm; font-size: 8pt; font-weight: bold;">
                        <div class="notes-title">Special Instructions / Notes:</div>
                        <div>
                            {{ $notes ?? 'Please verify all items upon receipt. Any discrepancies must be reported within 24 hours. This waybill serves as proof of delivery.' }}
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="right-col">
            <table style="width: 100%; border: 2px solid black; margin-bottom: 1mm;">
                <tr>
                    <td style="vertical-align: top; padding: 1.5mm; font-size: 8pt; font-weight: bold;">
                        <div class="notes-title">Delivery Information:</div>
                        <div class="detail" style="margin-bottom: 0.5mm;">
                            Total Items: {{ $waybill->waybillDetails ? count($waybill->waybillDetails) : 0 }}
                        </div>
                        <div class="detail" style="margin-bottom: 0.5mm;">
                            Delivery Date: {{ date('d M Y', strtotime($waybill->date)) }}
                        </div>
                        <div class="detail">
                            Status: {{ ucfirst(str_replace('_', ' ', $waybill->status)) }}
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <div class="signatures">
        <div class="signature-block">
            <div>Delivered By</div>
            <div style="margin-top: 8mm;">___________________</div>
            <div>&nbsp;</div>
        </div>
        <div class="signature-block">
            <div>Received By</div>
            <div style="margin-top: 8mm;">___________________</div>
            <div>&nbsp;</div>
        </div>
        <div class="signature-block">
            <div>Authorized By</div>
            <div style="margin-top: 8mm;">___________________</div>
            <div>&nbsp;</div>
        </div>
    </div>
</div>

{{--<div class="footer">--}}
{{--    Alta Interior - Official Delivery Document--}}
{{--</div>--}}

</body>
</html>
