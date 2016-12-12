/*******************************************************************************
 * Copyright 2015 Fondazione Bruno Kessler
 * 
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 * 
 *        http://www.apache.org/licenses/LICENSE-2.0
 * 
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 ******************************************************************************/
package eu.simpaticoproject.dashboard.controllers;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.Properties;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.servlet.http.HttpServletResponse;

import org.glassfish.grizzly.http.util.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.client.RestTemplate;

import edu.stanford.nlp.pipeline.Annotation;
import edu.stanford.nlp.pipeline.StanfordCoreNLP;
import eu.fbk.dh.tint.runner.TintPipeline;
import eu.fbk.dh.tint.runner.outputters.JSONOutputter;
import eu.fbk.dkm.pikes.twm.MachineLinking;
import eu.fbk.utils.core.PropertiesUtils;

/**
 * @author raman
 *
 */
@Controller
public class TextController {

    static Logger logger = LoggerFactory.getLogger(TextController.class.getName());

    private Properties itProps, enProps, esProps;
    
    private static Set<String> supportedLanguages = Stream.of("it", "en", "es").collect(Collectors.toCollection(HashSet::new));

    @Value("${text.server.url}")
    private String simpUlr;
    
	@Value("classpath:/simpatico.props")
	private Resource resource;
	
	@SuppressWarnings("unused")
//	@PostConstruct
	public void init() {
		Properties props = new Properties();
        try {
            InputStream stream = null;
            if (resource != null) {
                try {
					stream = resource.getInputStream();
				} catch (Exception e) {
					logger.error("No properties configured, using default");
				}
            }
            if (stream == null) {
                stream = TextController.class.getResourceAsStream("/simpatico-default.props");
            }
            props.load(stream);
            stream.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        enProps = PropertiesUtils.dotConvertedProperties(props, "en");
        itProps = PropertiesUtils.dotConvertedProperties(props, "it");
        esProps = PropertiesUtils.dotConvertedProperties(props, "es");

        logger.info("Loading English pipeline");
        StanfordCoreNLP enPipeline = new StanfordCoreNLP(enProps);

        logger.info("Loading Spanish pipeline");
        StanfordCoreNLP esPipeline = new StanfordCoreNLP(esProps);

        logger.info("Loading Italian pipeline");
        TintPipeline itPipeline = new TintPipeline();
        try {
            itPipeline.loadDefaultProperties();
            itPipeline.addProperties(itProps);
        } catch (IOException e) {
            e.printStackTrace();
        }
        itPipeline.load();
		
	}
    
	@RequestMapping("/textboard")
	public String textboard() {
		return "textboard";
	}
	@RequestMapping("/simp")
	public @ResponseBody String processProxy(@RequestParam String text, @RequestParam(required=false) String lang, HttpServletResponse res) throws IOException {
		RestTemplate restTemplate = new RestTemplate();
		return restTemplate.getForObject(simpUlr+"?text={text}&lang={lang}", String.class, text, lang);
	}

//	@RequestMapping("/simp")
	public @ResponseBody String process(@RequestParam String text, @RequestParam(required=false) String lang, HttpServletResponse res) throws IOException {

        Annotation annotation = null;

        Properties mlProperties = new Properties();
        mlProperties.setProperty("address", "http://ml.apnetwork.it/annotate");
        mlProperties.setProperty("min_confidence", "0.25");
        MachineLinking machineLinking = new MachineLinking(mlProperties);

        StanfordCoreNLP enPipeline = new StanfordCoreNLP(enProps);
        StanfordCoreNLP esPipeline = new StanfordCoreNLP(esProps);
        TintPipeline itPipeline = new TintPipeline();
        try {
            itPipeline.loadDefaultProperties();
            itPipeline.addProperties(itProps);
        } catch (IOException e) {
            e.printStackTrace();
        }
        itPipeline.load();

        logger.debug("Starting service");
		
        if (lang == null || !supportedLanguages.contains(lang)) {
            lang = machineLinking.lang(text);
        }

        switch (lang) {
        case "it":
            annotation = itPipeline.runRaw(text);
            break;
        case "es":
            annotation = new Annotation(text);
            esPipeline.annotate(annotation);
            break;
        case "en":
            annotation = new Annotation(text);
            enPipeline.annotate(annotation);
            break;
        }

        String json = "";
        if (annotation == null) {
            res.setStatus(HttpStatus.NOT_IMPLEMENTED_501.getStatusCode());
        } else {
            try {
                json = JSONOutputter.jsonPrint(annotation);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }        
		return json;
	}


}
