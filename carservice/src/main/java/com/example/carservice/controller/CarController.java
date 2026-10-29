package com.example.carservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.carservice.dto.CarRequest;
import com.example.carservice.dto.CarResponse;
import com.example.carservice.dto.PagedResponse;
import com.example.carservice.service.CarService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/cars")
@Tag(name = "Cars", description = "Car listing management endpoints")
public class CarController {

    private final CarService carService;

    public CarController(CarService carService) {
        this.carService = carService;
    }

    @PostMapping
    @Operation(summary = "Create new car listing", description = "Add a new car to the marketplace")
    @ApiResponse(responseCode = "201", description = "Car created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid car data")
    public ResponseEntity<CarResponse> createCar(@Valid @RequestBody CarRequest request) {
        CarResponse createdCar = carService.createCar(request);
        return new ResponseEntity<>(createdCar, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get valid cars with pagination", description = "Retrieve list of valid cars (with required fields: title, price, year)")
    @ApiResponse(responseCode = "200", description = "Cars retrieved successfully")
    public ResponseEntity<PagedResponse<CarResponse>> getValidCars(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {
        return ResponseEntity.ok(carService.getValidCars(page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get car by ID", description = "Retrieve detailed information about a specific car")
    @ApiResponse(responseCode = "200", description = "Car retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Car not found")
    public ResponseEntity<CarResponse> getCarById(@PathVariable Long id) {
        return ResponseEntity.ok(carService.getCarById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update car listing", description = "Update car information")
    @ApiResponse(responseCode = "200", description = "Car updated successfully")
    @ApiResponse(responseCode = "404", description = "Car not found")
    @ApiResponse(responseCode = "400", description = "Invalid car data")
    public ResponseEntity<CarResponse> updateCar(@PathVariable Long id,
                                                 @Valid @RequestBody CarRequest request) {
        return ResponseEntity.ok(carService.updateCar(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete car listing", description = "Remove a car from the marketplace")
    @ApiResponse(responseCode = "200", description = "Car deleted successfully")
    @ApiResponse(responseCode = "404", description = "Car not found")
    public ResponseEntity<Void> deleteCar(@PathVariable Long id) {
        carService.deleteCar(id);
        return ResponseEntity.ok().build(); 
    }
}