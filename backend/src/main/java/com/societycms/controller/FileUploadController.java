package com.societycms.controller;

import com.societycms.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private final String UPLOAD_DIR = "uploads/";

    @PostMapping
    public ResponseEntity<ApiResponse<String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Please select a file to upload."));
        }

        try {
            File directory = new File(UPLOAD_DIR);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : "";
            String newFilename = UUID.randomUUID().toString() + extension;
            
            Path path = Paths.get(UPLOAD_DIR + newFilename);
            Files.write(path, file.getBytes());

            String fileUrl = "/uploads/" + newFilename;
            return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", fileUrl));

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to upload file"));
        }
    }
}
