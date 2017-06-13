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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * @author raman
 *
 */
@Controller
public class DAController {

	private static final String TEMPLATE_SATISFACTION_OVERALL = "satisfaction_overall.json";
	private static final String TEMPLATE_MAPPING = "mapping.json";
	private static final String TEMPLATE_CTZP = "ctzp.json";
	private static final String TEMPLATE_WAE = "wae.json";
	private static final String TEMPLATE_TAE = "tae.json";
	private static final String TEMPLATE_TAE_ACTIONS = "tae-actions.json";
	private static final String TEMPLATE_SESSIONS = "sessions.json";
	private static final String TEMPLATE_CDV = "cdv.json";
	
	@Value("${da.elasticsearch.url}")
    private String daUrl;
    @Value("${da.elasticsearch.logindex}")
    private String daIndex;
    @Value("${da.elasticsearch.sharedindex}")
    private String sharedIndex;

    @PostConstruct
    public void initMappings() throws RestClientException, IOException{
		RestTemplate restTemplate = new RestTemplate();
		restTemplate.put(URI.create(daUrl + daIndex+ "/_mapping/LOG"), template(TEMPLATE_MAPPING));
    }

    /**
     * Citizenpedia stats: CTZP event counts by event type
     * @param eserviceId
     * @return
     * @throws IOException
     */
	@RequestMapping(value="/da/ctzp/{eserviceId:.*}", method=RequestMethod.GET, produces=MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody String ctzp(@PathVariable String eserviceId) throws IOException {
		RestTemplate restTemplate = new RestTemplate();
		String body = template(TEMPLATE_CTZP);
		return restTemplate.postForObject(daUrl + sharedIndex+ "/_search?size={size}&q={q}", body, String.class, 0, "_type:\"CTZP\" AND e-serviceID:\""+eserviceId+"\"");
	}

	/**
	 * WAE stats: WAE calls count
	 * @param eserviceId
	 * @return
	 * @throws IOException
	 */
	@RequestMapping(value="/da/wae/{eserviceId:.*}", method=RequestMethod.GET, produces=MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody String wae(@PathVariable String eserviceId) throws IOException {
		RestTemplate restTemplate = new RestTemplate();
		String body = template(TEMPLATE_WAE);
		return restTemplate.postForObject(daUrl + sharedIndex+ "/_search?size={size}&q={q}", body, String.class, 0, "_type:\"WAE\" AND e-serviceID:\""+eserviceId+"\"");
	}

	/**
	 * TAE stats: tae events count by event type
	 * @param eserviceId
	 * @return
	 * @throws IOException
	 */
	@RequestMapping(value="/da/tae/{eserviceId:.*}", method=RequestMethod.GET, produces=MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody String tae(@PathVariable String eserviceId) throws IOException {
		RestTemplate restTemplate = new RestTemplate();
		String body = template(TEMPLATE_TAE);
		return restTemplate.postForObject(daUrl + sharedIndex+ "/_search?size={size}&q={q}", body, String.class, 0, "_type:\"TAE\" AND e-serviceID:\""+eserviceId+"\"");
	}

	/**
	 * TAE-specific actions, used by free text simplification (show/click on wikipedia, synonim, definition) 
	 * WARNING: Custom metric, not present in base event data
	 * @param eserviceId
	 * @return
	 * @throws IOException
	 */
	@RequestMapping(value="/da/tae/{eserviceId}/actions", method=RequestMethod.GET, produces=MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody String taeActions(@PathVariable String eserviceId) throws IOException {
		RestTemplate restTemplate = new RestTemplate();
		String body = template(TEMPLATE_TAE_ACTIONS);
		return restTemplate.postForObject(daUrl + daIndex+ "/_search?size={size}&q={q}", body, String.class, 0, "component:\"tae\" AND action:* AND e-serviceID:\""+eserviceId+"\"");
	}

	/**
	 * Satisfaction metrics: distribution by faces, overall text simplification satisfaction, overall citizenpedia satisfaction
	 * @param eserviceId
	 * @return
	 * @throws IOException
	 */
	@RequestMapping(value="/da/satisfaction/{eserviceId}", method=RequestMethod.GET, produces=MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody String satisfaction(@PathVariable String eserviceId) throws IOException {
		RestTemplate restTemplate = new RestTemplate();
		String body = template(TEMPLATE_SATISFACTION_OVERALL);
		return restTemplate.postForObject(daUrl + daIndex+ "/_search?size={size}&q={q}", body, String.class, 0, "datatype:\"session-feedback\" AND e-serviceID:\""+eserviceId+"\"");
	}

	/**
	 * Session metrics: count and average duration
	 * @param eserviceId
	 * @return
	 * @throws IOException
	 */
	@RequestMapping(value="/da/sessions/{eserviceId}", method=RequestMethod.GET, produces=MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody String sessions(@PathVariable String eserviceId) throws IOException {
		RestTemplate restTemplate = new RestTemplate();
		String body = template(TEMPLATE_SESSIONS);
		return restTemplate.postForObject(daUrl + daIndex+ "/_search?size={size}&q={q}", body, String.class, 0, "datatype:\"duration\" AND timeForElement:\"session\" AND e-serviceID:\""+eserviceId+"\"");
	}

	/**
	 * CDV metrics: events and actions (savedata, usedata)
	 * @param eserviceId
	 * @return
	 * @throws IOException
	 */
	@RequestMapping(value="/da/cdv/{eserviceId}", method=RequestMethod.GET, produces=MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody String cdv(@PathVariable String eserviceId) throws IOException {
		RestTemplate restTemplate = new RestTemplate();
		String body = template(TEMPLATE_CDV);
		return restTemplate.postForObject(daUrl + daIndex+ "/_search?size={size}&q={q}", body, String.class, 0, "component:\"cdv\" AND e-serviceID:\""+eserviceId+"\"");
	}

	private String template(String name) throws IOException {
		try (BufferedReader buffer = new BufferedReader(new InputStreamReader(getClass().getResourceAsStream("/da-templates/"+name)))) {
            return buffer.lines().collect(Collectors.joining("\n"));
        }
	}
}
