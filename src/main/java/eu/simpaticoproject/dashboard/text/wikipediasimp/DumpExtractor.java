package eu.simpaticoproject.dashboard.text.wikipediasimp;

import eu.fbk.utils.core.CommandLine;
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import java.io.File;
import java.io.FileInputStream;

/**
 * Created by alessio on 06/07/16.
 */

public class DumpExtractor {

    private static final Logger LOGGER = LoggerFactory.getLogger(DumpExtractor.class);

    public static void main(String[] args) {
        try {
            final CommandLine cmd = CommandLine
                    .parser()
                    .withName("command")
                    .withHeader("Description of the command")
                    .withOption("i", "input-path", "the base path of the corpus", "DIR",
                            CommandLine.Type.DIRECTORY_EXISTING, true, false, true)
                    .withOption("o", "output-path", "output file", "DIR",
                            CommandLine.Type.FILE, true, false, true)
                    .withOption("l", "language", "output file", "DIR",
                            CommandLine.Type.STRING, true, false, true)
                    .withLogger(LoggerFactory.getLogger("eu.fbk")).parse(args);

            final File inputPath = cmd.getOptionValue("i", File.class);
            final File outputPath = cmd.getOptionValue("o", File.class);
            final String language = cmd.getOptionValue("l", String.class);

            SAXParserFactory factory = SAXParserFactory.newInstance();
            SAXParser saxParser = factory.newSAXParser();

            FileInputStream in = new FileInputStream(inputPath);
            BZip2CompressorInputStream bzIn = new BZip2CompressorInputStream(in);

            DumpHandler handler = null;
            switch (language) {
            case "it":
                handler = new ItalianHandler(outputPath);
                break;
            }
            if (handler == null) {
                LOGGER.error("Handler not set (language class not found)");
            } else {
                saxParser.parse(bzIn, handler);
            }

            bzIn.close();
            in.close();
        } catch (Exception e) {
            CommandLine.fail(e);
        }

    }
}
