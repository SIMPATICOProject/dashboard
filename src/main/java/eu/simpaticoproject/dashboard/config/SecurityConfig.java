package eu.simpaticoproject.dashboard.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configurers.provisioning.InMemoryUserDetailsManagerConfigurer;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.annotation.web.servlet.configuration.EnableWebMvcSecurity;
import org.springframework.util.StringUtils;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;

@Configuration
@EnableWebMvcSecurity
@EnableGlobalMethodSecurity(securedEnabled = true, prePostEnabled = true)
public class SecurityConfig extends WebSecurityConfigurerAdapter {

	@Value("classpath:/users.yml")
	private Resource resource;
	
	@Bean 
	public UserConfig getUserConfig() throws IOException {
		Yaml yaml = new Yaml(new Constructor(UserConfig.class));
		UserConfig data = (UserConfig) yaml.load(resource.getInputStream());
		return data;
	}
	
	@Autowired
	public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
		InMemoryUserDetailsManagerConfigurer<AuthenticationManagerBuilder> builder = auth.inMemoryAuthentication();
		getUserConfig().getUsers().forEach(
				u -> builder
				.withUser(u.getUsername())
				.password(u.getPassword())
				.roles(StringUtils.commaDelimitedListToStringArray(StringUtils.collectionToCommaDelimitedString(u.getRoles()))));
		
           // .withUser("user").password("password").roles("USER");
	}
	
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http
		.csrf()
		.disable();
				
		http
			.authorizeRequests()
			.antMatchers("/","/console/**")
			.authenticated()
			.anyRequest()
			.permitAll();
		
		http
			.formLogin()
				.loginPage("/login")
					.permitAll()
			.and()
				.logout()
					.permitAll();
	}

	@Bean
	@Override
	public AuthenticationManager authenticationManagerBean() throws Exception {
		return super.authenticationManagerBean();
	}	

}
