package com.egov.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EgovPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(EgovPlatformApplication.class, args);
    }
}
