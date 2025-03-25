<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Waybill - {{ $waybill->code }}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
            margin-bottom: 25mm; /* Berikan ruang lebih di bagian bawah untuk footer */
        }
        body {
            font-family: Arial, sans-serif;
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
        .wb-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 5mm;
        }
        .wb-number {
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

        .notes-title {
            font-weight: bold;
            margin-bottom: 2mm;
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
        <div class="wb-title">WAYBILL</div>
        <div class="wb-number">No : {{ $waybill->code }}</div>
        <div class="header-note">DELIVERY CONFIRMATION DOCUMENT</div>
    </div>

    <table style="width: 100%; border: none; margin-bottom: 5mm;">
        <tr>
            <td style="width: 48%; vertical-align: top; border: none;">
                <div class="company-label">From</div>
                <div>Alta Interior</div>
                <div>Jl. Cawas - Tawang No. 3, Ngreco, Weru, Sukoharjo</div>
                <div>Phone/Fax: 085741601168</div>
                <div>Branch: {{ $waybill->branch->name }}</div>
            </td>
            <td style="width: 4%; border: none;"></td>
            <td style="width: 48%; vertical-align: top; border: none;">
                <div class="company-label">To</div>
                @if($waybill->salesOrder->customer)
                    <div>{{ $waybill->salesOrder->customer->name }}</div>
                    <div>{{ $waybill->salesOrder->customer->address ?? 'Customer address' }}</div>
                    <div>Phone: {{ $waybill->salesOrder->customer->phone ?? '-' }}</div>
                    <div>Contact: {{ $waybill->salesOrder->customer->contact_name ?? '-' }}</div>
                @else
                    <div>{{ $waybill->salesOrder->customer_name ?? 'Customer name not provided' }}</div>
                    <div>Customer details not available</div>
                @endif
                <div>Date: {{ date('d M Y', strtotime($waybill->date)) }}</div>
            </td>
        </tr>
    </table>

    <table style="width: 100%; border: none; margin-bottom: 5mm;">
        <tr>
            <td style="width: 48%; vertical-align: top; border: 1px solid black; padding: 3mm;">
                <div class="company-label">Sales Order Reference</div>
                <div>SO Number: {{ $waybill->salesOrder->code }}</div>
                <div>SO Date: {{ date('d M Y', strtotime($waybill->salesOrder->date)) }}</div>
            </td>
            <td style="width: 4%; border: none;"></td>
            <td style="width: 48%; vertical-align: top; border: 1px solid black; padding: 3mm;">
                <div class="company-label">Waybill Details</div>
                <div>Waybill Number: {{ $waybill->code }}</div>
                <div>Waybill Date: {{ date('d M Y', strtotime($waybill->date)) }}</div>
                <div>Status: {{ ucfirst(str_replace('_', ' ', $waybill->status)) }}</div>
            </td>
        </tr>
    </table>

    <table>
        <thead>
        <tr>
            <th>No</th>
            <th>Item description / Part Number</th>
            <th>Item Location</th>
            <th>Qty</th>
            <th>UOM</th>
            <th>Description</th>
        </tr>
        </thead>
        <tbody>
        @foreach($waybill->waybillDetails as $index => $item)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $item->salesOrderDetail->item->name }} ({{ $item->salesOrderDetail->item->code }})</td>
                <td>{{ $item->salesOrderDetail->item_source_able->name ?? '-' }}</td>
                <td>{{ $item->quantity == floor($item->quantity) ? number_format($item->quantity, 0) : $item->quantity }}</td>
                <td>{{ $item->salesOrderDetail->item->itemUnit->abbreviation }}</td>
                <td>{{ $item->description ?? '-' }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <table style="width: 100%; border: none; margin-bottom: 5mm; margin-top: 10mm;">
        <tr>
            <td style="width: 33%; vertical-align: top; border: none; text-align: center;">
                <div>Delivered By</div>
                <div style="margin-top: 15mm;">___________________</div>
            </td>
            <td style="width: 33%; vertical-align: top; border: none; text-align: center;">
                <div>Received By</div>
                <div style="margin-top: 15mm;">___________________</div>
            </td>
            <td style="width: 33%; vertical-align: top; border: none; text-align: center;">
                <div>Authorized By</div>
                <div style="margin-top: 15mm;">___________________</div>
            </td>
        </tr>
    </table>

    <table style="width: 100%; border: 1px solid black; margin-bottom: 5mm; margin-top: 10mm;">
        <tr>
            <td style="vertical-align: top; padding: 3mm;">
                <div class="notes-title">Special Instructions / Notes:</div>
                <div>{{ $notes ?? 'Please verify all items upon receipt. Any discrepancies must be reported within 24 hours.' }}</div>
            </td>
        </tr>
    </table>
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
