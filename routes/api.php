<?php

use App\Http\Controllers\Api\ShareholderDashboardApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth')->get('/shareholder/dashboard', ShareholderDashboardApiController::class);
