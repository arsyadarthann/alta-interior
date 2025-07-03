<?php

namespace App\Interface;

interface ReportInterface
{
    public function getDashboard(): array;
    public function getProfitLoss(): array;
    public function getSales();
    public function getStockMovements(): array;
}
