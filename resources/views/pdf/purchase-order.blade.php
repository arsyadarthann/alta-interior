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
        <th>Unit Price</th>
        <th>Line Total</th>
    </tr>
    </thead>
    <tbody>
    @foreach($purchaseOrder->purchase_order_details as $index => $item)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ $item->item->name }} ({{ $item->item->code }})</td>
            <td>{{ $item->quantity }}</td>
            <td>{{ $item->item->item_unit->abbreviation }}</td>
            <td>Rp {{ substr(number_format($item->unit_price, 2, ',', '.'), -3) === ',00' ? number_format($item->unit_price, 0, '', '.') : number_format($item->unit_price, 2, ',', '.') }}</td>
            <td>Rp {{ substr(number_format($item->total_price, 2, ',', '.'), -3) === ',00' ? number_format($item->total_price, 0, '', '.') : number_format($item->total_price, 2, ',', '.') }}</td>
        </tr>
    @endforeach
    </tbody>
</table>

<table style="width: 100%; border: none; margin-bottom: 5mm;">
    <tr>
        <td style="width: 65%; border: none;"></td>
        <td style="width: 15%; text-align: right; border: none; font-weight: bold;">Sub-Total:</td>
        <td style="width: 20%; text-align: right; border: none;">Rp {{ substr(number_format($purchaseOrder->total_amount, 2, ',', '.'), -3) === ',00' ? number_format($purchaseOrder->total_amount, 0, '', '.') : number_format($purchaseOrder->total_amount, 2, ',', '.') }}</td>
    </tr>
    @if(isset($purchaseOrder->tax_rate) && $purchaseOrder->tax_rate)
        <tr>
            <td style="border: none;"></td>
            <td style="text-align: right; border: none; font-weight: bold;">Tax {{ $purchaseOrder->tax_rate->rate }}%:</td>
            <td style="text-align: right; border: none;">Rp {{ substr(number_format($purchaseOrder->tax_amount, 2, ',', '.'), -3) === ',00' ? number_format($purchaseOrder->tax_amount, 0, '', '.') : number_format($purchaseOrder->tax_amount, 2, ',', '.') }}</td>
        </tr>
    @else
        <tr>
            <td style="border: none;"></td>
            <td style="text-align: right; border: none; font-weight: bold;">Tax 0%:</td>
            <td style="text-align: right; border: none;">Rp 0</td>
        </tr>
    @endif
    <tr>
        <td style="border: none;"></td>
        <td style="text-align: right; border: none; font-weight: bold;">TOTAL:</td>
        <td style="text-align: right; border: none; font-weight: bold;">Rp {{ substr(number_format($purchaseOrder->grand_total, 2, ',', '.'), -3) === ',00' ? number_format($purchaseOrder->grand_total, 0, '', '.') : number_format($purchaseOrder->grand_total, 2, ',', '.') }}</td>
    </tr>
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

</body>
</html>
