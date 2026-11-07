package com.springboot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SecurityConfig {
    
    @Bean // PasswordEncoder 빈을 생성하는 메서드입니다. 이 메서드는 BCryptPasswordEncoder를 반환하여 비밀번호를 암호화하는 데 사용됩니다.  
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // 비밀번호를 암호화하는 PasswordEncoder 빈을 생성.
    }

}
    