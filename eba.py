import pandas as pd
import os
import pickle

def fips_prep():
    fips_url = 'https://raw.githubusercontent.com/kjhealy/fips-codes/master/county_fips_master.csv'
    df = pd.read_csv(fips_url, encoding='ISO-8859-1')
    df['fips'] = df['fips'].apply(lambda x: str(x).zfill(5))
    df = df[['fips', 'county_name', 'state_name']]
    df['full_name'] = df['county_name'] + ', ' + df['state_name']
    return df

def eba_data_prep():
    cbp20url = 'https://www2.census.gov/programs-surveys/cbp/datasets/2020/cbp20co.zip'
    df = pd.read_csv(cbp20url)

    df['fipstate'] = df['fipstate'].apply(lambda x: str(x).zfill(2))
    df['fipscty'] = df['fipscty'].apply(lambda x: str(x).zfill(3))
    df['fips'] = df['fipstate'] + df['fipscty']
    df = df[['fips', 'naics', 'emp']]
    df = df.rename(columns={'emp': 'emp_co'})

    # remove all '-' or '/' from df['naics']
    df['naics'] = df['naics'].str.replace('-', '')
    df['naics'] = df['naics'].str.replace('/', '')
    # df[digit] = digit of df['naics']
    df['digit'] = df['naics'].str.len()
    df.loc[df['digit'] == 0, 'naics'] = '0'

    cbp20us_url = 'https://www2.census.gov/programs-surveys/cbp/datasets/2020/cbp20us.zip'
    df_us = pd.read_csv(cbp20us_url)
    df_us = df_us.rename(columns={'emp': 'emp_us'})
    df_us = df_us[df_us['lfo'] == '-']
    df_us = df_us[['naics', 'emp_us']]
    naics_desc_url = 'https://www2.census.gov/programs-surveys/cbp/technical-documentation/reference/naics-descriptions/naics2017.txt'
    naics_desc = pd.read_csv(naics_desc_url, sep=",", encoding='cp1252')
    naics_desc.columns = ['naics', 'description']
    # join naics_desc into df, using naics as the key
    df_us = df_us.merge(naics_desc, on='naics')

    # remove all '-' or '/' from df['naics']
    df_us['naics'] = df_us['naics'].str.replace('-', '')
    df_us['naics'] = df_us['naics'].str.replace('/', '')
    # df[digit] = digit of df['naics']
    df_us['digit'] = df_us['naics'].str.len()
    df_us.loc[df_us['digit'] == 0, 'naics'] = '0'

    # dump pickle
    with open('eba_prep_us.pkl', 'wb') as f:
        pickle.dump(df_us, f)
    with open('eba_prep_co.pkl', 'wb') as f:
        pickle.dump(df, f)

def calc_lq(county_fips, naics_digits, items_to_show):
    with open('eba_prep_us.pkl', 'rb') as f:
        df_us = pickle.load(f)
    with open('eba_prep_co.pkl', 'rb') as f:
        df = pickle.load(f)
    # turn string naics_digits into a int
    naics_digits = int(naics_digits)
    # use example of 06073 and 4-digit naics
    df_co_wip = df[df['fips'] == county_fips]
    # keep only 0 or 4 digit naics
    df_co_wip = df_co_wip[(df_co_wip['digit'] == 0) | (df_co_wip['digit'] == naics_digits)]
    df_us_wip = df_us[(df_us['digit'] == 0) | (df_us['digit'] == naics_digits)]
    # drop digit columns
    df_co_wip = df_co_wip.drop(columns=['digit'])
    df_us_wip = df_us_wip.merge(df_co_wip, on='naics')

    et_co = df_us_wip[df_us_wip['digit'] == 0]['emp_co'].sum()
    et_us = df_us_wip[df_us_wip['digit'] == 0]['emp_us'].sum()
    df_us_wip['perc_co'] = df_us_wip['emp_co'] / et_co
    df_us_wip['perc_us'] = df_us_wip['emp_us'] / et_us
    df_us_wip['lq'] = df_us_wip['perc_co'] / df_us_wip['perc_us']

    df = df_us_wip[['naics', 'description', 'emp_co', 'lq']]
    df = df.rename(columns={'emp_co': 'employment', 'lq': 'location_quotient'})
    # return all rows with location_quotient > 1 and sort by location_quotient, keep only top 10
    df = df[df['location_quotient'] > 1].sort_values(by='location_quotient', ascending=False).head(items_to_show)
    return df

if __name__ == '__main__':
    fips_prep()