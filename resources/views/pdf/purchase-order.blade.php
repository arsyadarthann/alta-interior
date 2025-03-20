<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Purchase Order - {{ $purchaseOrder->code }}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            position: relative;
            min-height: 100%;
        }
        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            border-top: 1px solid #ddd;
            padding-top: 2mm;
            font-size: 8pt;
            color: #777;
            text-align: center;
        }
        .header {
            text-align: center;
            margin-bottom: 10mm;
        }
        .po-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 5mm;
        }
        .po-number {
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
    </style>
</head>
<body>
<div class="header">
    <div class="po-title">PURCHASE ORDER</div>
    <div class="po-number">No : {{ $purchaseOrder->code }}</div>
    <div class="header-note">PLEASE REFER TO ABOVE NUMBER WHEN SUBMITTING INVOICE</div>
</div>

<table style="width: 100%; border: none; margin-bottom: 5mm;">
    <tr>
        <td style="width: 48%; vertical-align: top; border: none;">
            <div class="company-label">Company</div>
            <div>Alta Interior</div>
            <div>Jl. Cawas - Tawang No. 3, Ngreco, Weru, Sukoharjo</div>
            <div>Phone/Fax: 085741601168</div>
            <div>Contact: Pak Bagus</div>
        </td>
        <td style="width: 4%; border: none;"></td>
        <td style="width: 48%; vertical-align: top; border: none;">
            <div class="company-label">Bill to</div>
            <div>{{ $purchaseOrder->supplier->name }}</div>
            <div>{{ $purchaseOrder->supplier->address ?? 'Supplier address' }}</div>
            <div>Phone/Fax: {{ $purchaseOrder->supplier->phone ?? '-' }}</div>
            <div>Contact: {{ $purchaseOrder->supplier->contact_person ?? '-' }}</div>
            <div>Date: {{ date('d M Y', strtotime($purchaseOrder->date)) }}</div>
        </td>
    </tr>
</table>

<table>
    <thead>
    <tr>
        <th>No</th>
        <th>Item description / Part Number</th>
        <th>Qty</th>
        <th>UOM</th>
    </tr>
    </thead>
    <tbody>
    @foreach($purchaseOrder->purchase_order_details as $index => $item)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ $item->item->name }} ({{ $item->item->code }})</td>
            <td>{{ $item->quantity }}</td>
            <td>{{ $item->item->item_unit->abbreviation }}</td>
        </tr>
    @endforeach
    </tbody>
</table>

<table style="width: 100%; border: none; margin-bottom: 5mm;">
    <tr>
        <td style="width: 48%; vertical-align: top; border: 1px solid black; padding: 3mm;">
            <div class="notes-title">Note:</div>
            <div>{{ $notes ?? 'Please deliver the items to our office as per the mentioned delivery date.' }}</div>
        </td>
        <td style="width: 4%; border: none;"></td>
        <td style="width: 48%; vertical-align: top; border: none; text-align: right;">
            <div>Alta Interior</div>
            <div style="margin-top: 15mm;">{{ $purchaseOrder->user->name ?? 'Authorized Signatory' }}</div>
            <div>{{ $userPosition ?? 'Purchasing Officer' }}</div>
        </td>
    </tr>
</table>

<div class="footer">
    This document was printed on {{ date('d M Y') }} at {{ date('H:i') }} by {{ auth()->user()->name ?? 'System' }}
</div>

</body>
</html>
