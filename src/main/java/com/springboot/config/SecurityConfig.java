package com.springboot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    
    // 회원가입 시 비밀번호를 암호화하고 로그인 시 입력값과 저장된 암호를 비교한다.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // HTTP 요청의 인증 여부와 로그인·로그아웃 처리 규칙을 정의한다.
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http, // 보안 필터 체인의 접근 권한과 인증 방식을 설정한다.
            UserDetailsService userDetailsService) throws Exception { // 로그인 아이디로 DB 회원을 조회해 인증에 사용할 정보를 제공한다.
        http
            .userDetailsService(userDetailsService)
            // 요청별로 로그인 필요 여부를 결정한다.
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login", "/signup", "/main", "/css/**", "/js/**","/api/**")
                .permitAll()
                .anyRequest()
                .authenticated()
            )

            // HTML 로그인 폼을 사용한 인증 흐름을 설정한다.
            .formLogin(form -> form
                .loginPage("/login") // 인증되지 않은 사용자가 이동할 로그인 화면
                .loginProcessingUrl("/login") // 로그인 폼의 POST 요청을 Spring Security가 처리하는 주소
                .usernameParameter("username") // 로그인 폼에서 사용자 식별자를 담는 input의 name
                .passwordParameter("password") // 로그인 폼에서 비밀번호를 담는 input의 name
                .defaultSuccessUrl("/main", true) // 인증 성공 후 이동할 주소
                .failureUrl("/login?error=true") // 인증 실패 후 이동할 주소
                .permitAll()
            )
            // 로그아웃 후 세션을 정리하고 로그인 화면으로 이동한다.
            .logout(logout -> logout
                .logoutSuccessUrl("/login?logout=true")
                .permitAll()
            );

        return http.build();
    }
}
    