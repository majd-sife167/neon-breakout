package com.example.breakout;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;

/** Entry point: loads the Scene Builder layout and starts the controller. */
public class App extends Application {

    @Override
    public void start(Stage stage) throws Exception {
        FXMLLoader loader = new FXMLLoader(App.class.getResource("game.fxml"));
        Scene scene = new Scene(loader.load());
        stage.setTitle("Neon Breakout - JavaFX");
        stage.setScene(scene);
        stage.setResizable(false);
        stage.show();
        loader.<GameController>getController().init(scene);
    }

    public static void main(String[] args) {
        launch(args);
    }
}
