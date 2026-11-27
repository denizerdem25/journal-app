package com.deniz.journal.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Token kullandığımız için CSRF korumasına gerek yok
                .csrf(csrf -> csrf.disable())
                // CorsConfig'teki ayarları kullan
                .cors(Customizer.withDefaults())
                // Sunucu oturum tutmaz; her istek kendi token'ıyla gelir
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/error").permitAll()
                        .anyRequest().authenticated()
                )
                // Authorization: Bearer <token> başlığındaki JWT'yi doğrula
                .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()));

        return http.build();
    }

    /** Şifreleri hashlemek ve karşılaştırmak için */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Token'ı nereden okuyacağımız:
     * - Medya dosyaları (/api/media/5/file): ?access_token=... adres parametresinden de kabul et
     *   (çünkü <img>, <video>, <audio> header gönderemez)
     * - Diğer her şey: yalnızca Authorization header'ından
     */
    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        DefaultBearerTokenResolver headerOnly = new DefaultBearerTokenResolver();

        DefaultBearerTokenResolver headerOrQuery = new DefaultBearerTokenResolver();
        headerOrQuery.setAllowUriQueryParameter(true);

        return request -> request.getRequestURI().matches("^/api/media/\\d+/file$")
                ? headerOrQuery.resolve(request)
                : headerOnly.resolve(request);
    }
}