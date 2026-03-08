from dash import html
import dash_bootstrap_components as dbc

def create_header():
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                html.H1("Economic Base Analysis Tool", className="text-center mb-4"),
                html.P([
                    "This tool helps analyze the economic base of counties using location quotient analysis. ",
                    "Select a county and NAICS digit level to identify industries that are more concentrated ",
                    "in the selected county compared to the national average."
                ], className="text-center mb-4"),
            ], width=12)
        ]),
        html.Hr(className="my-4")
    ], className="py-4") 