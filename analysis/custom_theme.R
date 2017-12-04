###################
## custom theme

library(ggplot2)
library(colormap)
library(extrafont)

# font is here: https://fonts.google.com/specimen/Noto+Sans?selection.family=Noto+Sans:400,400i,700
font_import(pattern = "NotoSans", prompt = FALSE)

pallete<- c("#484EF4", "#1922FF",  "#0009FF",	"#B29000", 	"#FFCD00")
pallete2 <- c("#4870F4", "#3D5399",  "#00C2FF",	"#FF8440", 	"#CC3912")
scale_fill_mark <- function(){
  structure(list(
    scale_fill_manual(values=pallete)
  ))
}

scale_color_discrete_mark <- function(){
  structure(list(
    scale_color_manual(values=pallete)
  ))
}

scale_color_continuous_mark <- function(){
  structure(list(
    scale_color_gradientn(colours = pallete2)
  ))
}
##################################

theme_mark <- function(base_size=12, font=NA){
  
  small_txt <- element_text(size = base_size*0.8, color = "#333333", family="Noto Sans")
  txt <- element_text(size = base_size, color = "#333333", family="Noto Sans")
  italic_txt <- element_text(size = base_size*0.8, color = "#333333", family="NotoSans-Italic")
  bold_txt <- element_text(size = base_size+2, color = "#333333", family="NotoSans-Bold")
  
  theme_minimal(base_size = base_size, base_family = font) +
    theme(
      legend.key = element_blank(), 
      strip.background = element_blank(), 
      ########### text
      text = txt, 
      plot.title = bold_txt,
      plot.caption = italic_txt, 
      axis.title = txt, 
      axis.text = small_txt, 
      legend.text = small_txt,
      legend.title = small_txt) +
    
    ############## axis, panels, legend, etc
    theme(
      axis.line.y = element_line(color = "#333333", size = 0.8, linetype = "solid"),
      axis.line.x = element_line(color = "#333333", size = 0.8, linetype = "solid"),
      
      axis.ticks.x =  element_line(color = "#333333", size = 0.2, linetype = "solid"),
      axis.ticks.y =  element_line(color = "#333333", size = 0.2, linetype = "solid"),
      
      panel.grid.major = element_line(color = "#f0f0f0", size = 0.2, linetype = "solid"),
      panel.grid.minor = element_line(color = "#f0f0f0", size = 0.05, linetype = "solid"),
      panel.border = element_blank(),
      
      legend.position = "right", 
      # legend.title = element_blank(),
      legend.key = element_rect(fill = "#f8f8f8", color = "#f8f8f8"),
      legend.background = element_rect( fill = "#f8f8f8",color = "#f8f8f8", size = 0.5, linetype = "solid"),
      
      ## background
      plot.background = element_rect(fill = "#f8f8f8",size = 0.5)
    )
}

####################

theme_set(theme_mark()) 